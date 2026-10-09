
const numberFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
});

const amountFormat = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const chartColors = [
    "#0d9488",
    "#2563eb",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444"
];

Chart.defaults.font.family = '"Segoe UI", Arial, sans-serif';
Chart.defaults.color = "#718096";

async function loadDashboard() {
    const errorElement = document.getElementById("error-message");

    try {
        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            throw new Error(`Dashboard API returned ${response.status}`);
        }

        const data = await response.json();

        // 1. KPI cards
        document.getElementById("total-transactions").textContent =
            numberFormat.format(data.kpis.total_transactions ?? 0);

        document.getElementById("total-value").textContent =
            amountFormat.format(data.kpis.total_transaction_value ?? 0);

        document.getElementById("total-customers").textContent =
            numberFormat.format(data.kpis.total_customers ?? 0);

        document.getElementById("total-accounts").textContent =
            numberFormat.format(data.kpis.total_accounts ?? 0);

        document.getElementById("average-value").textContent =
            amountFormat.format(data.kpis.average_transaction_value ?? 0);

        // 2. Daily transaction summary
        renderTrendSummary(data.transaction_trends || []);

        // 3. Transaction value by type
        createChart(
            "type-chart",
            "bar",
            (data.value_by_type || []).map(
                row => row.transaction_type || "Unknown"
            ),
            [{
                label: "Transaction Value",
                data: (data.value_by_type || []).map(
                    row => Number(row.transaction_value || 0)
                ),
                backgroundColor: chartColors
            }],
            "Amount"
        );

        // 4. Transaction status distribution
        createChart(
            "status-chart",
            "doughnut",
            (data.status_distribution || []).map(
                row => row.status || "Unknown"
            ),
            [{
                label: "Transactions",
                data: (data.status_distribution || []).map(
                    row => Number(row.transaction_count || 0)
                ),
                backgroundColor: chartColors
            }],
            "Transaction Count"
        );

        // 5. Accounts by type
        createChart(
            "account-chart",
            "bar",
            (data.accounts_by_type || []).map(
                row => row.account_type || "Unknown"
            ),
            [{
                label: "Accounts",
                data: (data.accounts_by_type || []).map(
                    row => Number(row.account_count || 0)
                ),
                backgroundColor: chartColors
            }],
            "Account Count"
        );

    } catch (error) {
        console.error("Dashboard loading failed:", error);

        errorElement.textContent =
            "Unable to load dashboard data. Check the Flask terminal and Snowflake connection.";
    }
}

function renderTrendSummary(rows) {
    const container = document.getElementById("trend-summary");

    if (!rows.length) {
        container.textContent = "No transaction data available.";
        return;
    }

    // Use the actual dates and counts returned by Snowflake.
    // No dates or transactions are artificially generated.
    const total = rows.reduce(
        (sum, row) => sum + Number(row.transaction_count || 0),
        0
    );

    const latest = rows[rows.length - 1];

    const date = new Date(latest.transaction_date);

    const formattedDate = Number.isNaN(date.getTime())
        ? String(latest.transaction_date)
        : date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        });

    const dayCount = rows.length;
    const description = dayCount === 1
        ? "Currently showing one day of available data."
        : `Data available across ${numberFormat.format(dayCount)} days.`;

    container.replaceChildren();

    const dateElement = document.createElement("div");
    dateElement.className = "trend-date";
    dateElement.textContent = formattedDate;

    const totalSection = document.createElement("div");

    const totalElement = document.createElement("div");
    totalElement.className = "trend-total";
    totalElement.textContent = numberFormat.format(total);

    const captionElement = document.createElement("div");
    captionElement.className = "trend-caption";
    captionElement.textContent = "Transactions recorded";

    totalSection.append(totalElement, captionElement);

    const bar = document.createElement("div");
    bar.className = "trend-bar";

    const fill = document.createElement("div");
    fill.className = "trend-bar-fill";
    bar.appendChild(fill);

    const descriptionElement = document.createElement("div");
    descriptionElement.className = "trend-caption";
    descriptionElement.textContent = description;

    container.append(
        dateElement,
        totalSection,
        bar,
        descriptionElement
    );
}

function createChart(canvasId, type, labels, datasets, axisTitle) {
    const canvas = document.getElementById(canvasId);

    // Prevent duplicate charts if the function runs again.
    const existingChart = Chart.getChart(canvas);

    if (existingChart) {
        existingChart.destroy();
    }

    const isCircular = type === "doughnut";

    new Chart(canvas, {
        type,
        data: {
            labels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: isCircular,
                    position: "bottom"
                },
                tooltip: {
                    enabled: true
                }
            },
            scales: isCircular ? {} : {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: axisTitle
                    }
                }
            }
        }
    });
}

loadDashboard();
