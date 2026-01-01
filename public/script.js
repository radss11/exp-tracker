const userId = localStorage.getItem("userId");
if (!userId) {
  window.location.href = "/login.html";
}

let chart;

async function setBudget() {
  const amount = document.getElementById("budgetInput").value;
  await fetch("/budget", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount,
    userId
  })
});
  loadData();
}

async function addExpense() {
  const expense = {
    title: title.value,
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
  const budgetRes = await fetch(`/budget/${userId}`);

  const budget = await budgetRes.json();

  const expensesRes = await fetch(`/expenses/${userId}`);

  const expenses = await expensesRes.json();

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById("remaining").innerText =
    `Remaining Budget: ₹${budget.amount - totalSpent}`;

  drawChart(expenses);
}

function drawChart(expenses) {
  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  });

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "pie",
    data: {
      labels: Object.keys(categoryMap),
      datasets: [{
        data: Object.values(categoryMap),
        borderWidth: 1
      }]
    },
    options: {
      responsive: false,   // 🔥 KEY LINE
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}


loadData();
