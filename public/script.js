let selectedMonth = new Date().toISOString().slice(0, 7);
const userId = localStorage.getItem("userId");
if (!userId) {
  window.location.href = "/login.html";
}

let chart;

async function setBudget() {
  const amount = budgetInput.value;
  const month = budgetMonth.value;

  if (!month || !amount) {
    alert("Please select month and enter budget");
    return;
  }

  await fetch("/budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      month,
      amount
    })
  });

  selectedMonth = month;
  loadData();
}


async function addExpense() {
  if (!date.value || !amount.value || !category.value) {
    alert("Please fill all expense fields");
    return;
  }

  const expense = {
    title: title.value || "Expense",
    category: category.value,
    amount: amount.value,
    date: date.value
  };

  await fetch("/expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...expense,
      userId
    })
  });

  loadData();
}


async function loadData() {
  const budgetRes = await fetch(`/budget/${userId}/${selectedMonth}`);
  const budget = await budgetRes.json();

  const expensesRes = await fetch(`/expenses/${userId}`);
  const allExpenses = await expensesRes.json();

  const monthlyExpenses = allExpenses.filter(e =>
    e.date.startsWith(selectedMonth)
  );

  const totalSpent = monthlyExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  remaining.innerText =
    `Remaining Budget (${selectedMonth}): ₹${budget.amount - totalSpent}`;

  drawChart(monthlyExpenses);
}


function drawChart(expenses) {
  const categoryMap = {};

  expenses.forEach(e => {
    const category = e.category;
    categoryMap[category] = (categoryMap[category] || 0) + Number(e.amount);
  });

  const categoryColors = {
    medicine: "#e74c3c",
    fuel: "#e67e22",
    household: "#3498db",
    academic: "#9b59b6",
    food: "#2ecc71",
    electricity: "#f1c40f",
    "water bills": "#1abc9c",
    general: "#95a5a6"
  };

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);
  const backgroundColors = labels.map(
    category => categoryColors[category] || "#bdc3c7"
  );

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}


loadData();

date.addEventListener("change", () => {
  selectedMonth = date.value.slice(0, 7);
  budgetMonth.value = selectedMonth;
  loadData();
});

