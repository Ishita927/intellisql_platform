import os
import re
from openai import OpenAI

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")

if not NVIDIA_API_KEY:
    raise RuntimeError("NVIDIA_API_KEY not set in .env")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY,
)


def format_schema_for_prompt(tables: list[dict]) -> str:
    """tables: [{"name": ..., "columns": [{"name","type","is_primary_key"}], "foreign_keys": [...]}]"""
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
    """Strip markdown code fences if the model wraps the SQL in ```sql ... ```"""
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
        model=NVIDIA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=512,
    )

    raw_text = response.choices[0].message.content
    sql = extract_sql(raw_text)
    return sql