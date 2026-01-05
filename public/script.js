const token = localStorage.getItem("token");
if (!token) location.href = "/login.html";

const categoryColors = {
  medicine: "#ff6384",
  fuel: "#ff9f40",
  household: "#4bc0c0",
  academic: "#9966ff",
  food: "#36a2eb",
  electricity: "#ffcd56",
  water: "#c9cbcf",
  general: "#8bc34a"
};

let chart;

// ---------- LOGOUT ----------
function logout() {
  localStorage.removeItem("token");
  location.href = "/login.html";
}

// ---------- SET BUDGET ----------
function saveBudget() {
  const month = document.getElementById("month").value;
  const amount = document.getElementById("budget").value;

  fetch("/budget", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({ month, amount })
  }).then(() => loadData());
}

// ---------- ADD EXPENSE ----------
function addExpense() {
  fetch("/expense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      title: title.value,
      category: category.value,
      amount: amount.value,
      date: date.value
    })
  }).then(() => loadData());
}

// ---------- LOAD DATA ----------
function loadData() {
  const month = document.getElementById("month").value;

  fetch(`/budget/${month}`, {
    headers: { "Authorization": token }
  })
  .then(r => r.json())
  .then(b => {
    document.getElementById("budgetInfo").innerText =
      "Monthly Budget: ₹" + b.amount;
  });

  fetch(`/expenses/${month}`, {
    headers: { "Authorization": token }
  })
  .then(r => r.json())
  .then(expenses => drawChart(expenses));
}

// ---------- PIE CHART ----------
function drawChart(expenses) {
  const totals = {};

  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = labels.map(l => categoryColors[l]);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

loadData();
