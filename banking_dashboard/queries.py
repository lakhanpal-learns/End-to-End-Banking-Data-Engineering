
from snowflake_client import get_connection


def fetch_all(connection, sql, params=None):
    cursor = connection.cursor()

    try:
        cursor.execute(sql, params or {})
        columns = [col[0].lower() for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        cursor.close()


def get_kpis(connection):
    rows = fetch_all(connection, """
        SELECT
            COUNT(DISTINCT TRANSACTION_ID) AS total_transactions,
            COALESCE(SUM(AMOUNT), 0) AS total_transaction_value,
            COALESCE(AVG(AMOUNT), 0) AS average_transaction_value
        FROM BANKING.ANALYTICS.FACT_TRANSACTION
    """)

    counts = fetch_all(connection, """
        SELECT
            (SELECT COUNT(*)
             FROM BANKING.ANALYTICS.DIM_CUSTOMER
             WHERE IS_CURRENT = TRUE) AS total_customers,
            (SELECT COUNT(*)
             FROM BANKING.ANALYTICS.DIM_ACCOUNTS
             WHERE IS_CURRENT = TRUE) AS total_accounts
    """)

    return {**rows[0], **counts[0]}


def get_transaction_trends(connection):
    return fetch_all(connection, """
        SELECT
            TO_DATE(TRANSACTION_TIME) AS transaction_date,
            COUNT(DISTINCT TRANSACTION_ID) AS transaction_count
        FROM BANKING.ANALYTICS.FACT_TRANSACTION
        WHERE TRANSACTION_TIME IS NOT NULL
        GROUP BY TO_DATE(TRANSACTION_TIME)
        ORDER BY transaction_date
    """)


def get_value_by_type(connection):
    return fetch_all(connection, """
        SELECT
            TRANSACTION_TYPE,
            SUM(AMOUNT) AS transaction_value
        FROM BANKING.ANALYTICS.FACT_TRANSACTION
        GROUP BY TRANSACTION_TYPE
        ORDER BY transaction_value DESC
    """)


def get_status_distribution(connection):
    return fetch_all(connection, """
        SELECT
            STATUS,
            COUNT(DISTINCT TRANSACTION_ID) AS transaction_count
        FROM BANKING.ANALYTICS.FACT_TRANSACTION
        GROUP BY STATUS
        ORDER BY transaction_count DESC
    """)


def get_accounts_by_type(connection):
    return fetch_all(connection, """
        SELECT
            ACCOUNT_TYPE,
            COUNT(DISTINCT ACCOUNT_ID) AS account_count
        FROM BANKING.ANALYTICS.DIM_ACCOUNTS
        WHERE IS_CURRENT = TRUE
        GROUP BY ACCOUNT_TYPE
        ORDER BY account_count DESC
    """)
