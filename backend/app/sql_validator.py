import sqlglot
from sqlglot import exp

# statement types that must never be allowed through
FORBIDDEN_TYPES = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.Alter,
    exp.Create,
    exp.TruncateTable,
    exp.Grant,
)


class SQLValidationError(Exception):
    pass


def validate_select_only(sql: str) -> str:
    """
    Parses the SQL and ensures it is a single, safe SELECT statement.
    Returns the validated SQL (stripped) on success.
    Raises SQLValidationError on any violation.
    """
    sql = sql.strip().rstrip(";")

    if not sql:
        raise SQLValidationError("Empty SQL query")

    try:
        statements = sqlglot.parse(sql, read="postgres")
    except Exception as e:
        raise SQLValidationError(f"SQL could not be parsed: {str(e)}")

    if len(statements) == 0:
        raise SQLValidationError("No valid SQL statement found")

    if len(statements) > 1:
        raise SQLValidationError("Multiple statements are not allowed - only one SELECT is permitted")

    stmt = statements[0]

    if stmt is None:
        raise SQLValidationError("SQL could not be parsed")

    for forbidden_type in FORBIDDEN_TYPES:
        if isinstance(stmt, forbidden_type) or stmt.find(forbidden_type):
            raise SQLValidationError(
                "Unsafe query: " + forbidden_type.__name__ + " statements are not allowed"
            )

    if not isinstance(stmt, (exp.Select, exp.Union)):
        raise SQLValidationError(
            "Only SELECT queries are allowed - got " + type(stmt).__name__
        )

    return sql + ";"