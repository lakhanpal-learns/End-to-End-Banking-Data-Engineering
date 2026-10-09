from flask import Flask, jsonify, render_template
from snowflake_client import get_connection
from queries import (
    get_accounts_by_type,
    get_kpis,
    get_status_distribution,
    get_transaction_trends,
    get_value_by_type,
)

app = Flask(__name__)


@app.route("/")
def dashboard():
    return render_template("index.html")



@app.route("/api/dashboard")
def dashboard_data():
    connection = get_connection()

    try:
        return jsonify({
            "kpis": get_kpis(connection),
            "transaction_trends": get_transaction_trends(connection),
            "value_by_type": get_value_by_type(connection),
            "status_distribution": get_status_distribution(connection),
            "accounts_by_type": get_accounts_by_type(connection),
        })
    finally:
        connection.close()



if __name__ == "__main__":
    app.run(debug=True)
