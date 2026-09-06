import os
import re
import json
from openai import OpenAI

HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "Qwen/Qwen2.5-Coder-32B-Instruct")

if not HF_TOKEN:
    raise RuntimeError("HF_TOKEN not set in .env")

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_TOKEN,
)


def format_schema_for_prompt(tables: list[dict]) -> str:
    lines = []
    for table in tables:
        lines.append(f"Table: {table['name']}")
        lines.append("Columns:")
        for col in table["columns"]:
            pk_marker = " (PRIMARY KEY)" if col["is_primary_key"] else ""
            lines.append(f"  {col['name']} - {col['type']}{pk_marker}")
        if table["foreign_keys"]:
            lines.append("Foreign Keys:")
            for fk in table["foreign_keys"]:
                lines.append(
                    f"  {fk['column']} references {fk['references_table']}.{fk['references_column']}"
                )
        lines.append("")
    return "\n".join(lines)


def extract_sql(raw_text: str) -> str:
    match = re.search(r"```(?:sql)?\s*(.*?)```", raw_text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return raw_text.strip()


def generate_sql(question: str, tables: list[dict]) -> str:
    schema_text = format_schema_for_prompt(tables)

    prompt = f"""You are a PostgreSQL expert. Given the database schema below, generate a single SELECT query that answers the user's question.

Available Database Schema:

{schema_text}

User Question:
{question}

Rules:
- Generate PostgreSQL SELECT query only.
- Do not use INSERT, UPDATE, DELETE, DROP, ALTER, or any other data-modifying statement.
- Only reference tables and columns that exist in the schema above.
- Return ONLY the SQL query, no explanation, no markdown formatting.
"""

    response = client.chat.completions.create(
        model=HF_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=512,
    )

    raw_text = response.choices[0].message.content
    sql = extract_sql(raw_text)
    return sql



def analyze_question(question: str, tables: list[dict]) -> dict:
    """
    Returns a dict:
    {
      "intent": "ranking" | "lookup" | "aggregation" | "filter" | ...,
      "entity": "customers",
      "metric": "revenue" or null,
      "is_complete": true/false,
      "clarification_question": "..." or null,
      "clarification_options": ["Revenue", "Number of orders", "Quantity purchased"] or []
    }
    """
    schema_text = format_schema_for_prompt(tables)

    prompt = f"""You are analyzing a natural language question about a database, BEFORE generating any SQL.

Available Database Schema:

{schema_text}

User Question:
{question}

Your job: decide if this question has enough information to write a precise SQL query.

Common cases needing clarification:
- "Show top customers" -> missing HOW to rank them (by revenue? order count? quantity?)
- "Show recent orders" -> missing time range (last 7 days? last month?)
- "Show best products" -> missing what "best" means (highest sales? highest rating? most reviews?)

If the question is already precise and answerable as-is (e.g. "Show all customers", "List employees in the Sales department"), it is complete.

Respond with ONLY a JSON object, no markdown, no explanation, in this exact shape:
{{
  "intent": "short label like ranking, lookup, aggregation, filter, comparison",
  "entity": "the main table/concept the question is about",
  "metric": "the ranking/aggregation metric if mentioned, otherwise null",
  "is_complete": true or false,
  "clarification_question": "a short question to ask the user if not complete, otherwise null",
  "clarification_options": ["option1", "option2", "option3"] (empty array if complete)
}}
"""

    response = client.chat.completions.create(
        model=HF_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=400,
    )

    raw_text = response.choices[0].message.content.strip()

    # strip markdown fences if the model wraps it anyway
    match = re.search(r"```(?:json)?\s*(.*?)```", raw_text, re.DOTALL | re.IGNORECASE)
    json_text = match.group(1).strip() if match else raw_text

    try:
        result = json.loads(json_text)
    except json.JSONDecodeError:
        # fail safe: if we can't parse the analysis, assume complete and let generate_sql handle it directly
        result = {
            "intent": "unknown",
            "entity": "unknown",
            "metric": None,
            "is_complete": True,
            "clarification_question": None,
            "clarification_options": [],
        }

    return result