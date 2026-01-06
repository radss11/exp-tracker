const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = "exp_tracker_secret_key"; // OK for project/demo

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Database
const db = new sqlite3.Database("database.db");

// ---------- TABLES ----------

// Users
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT
)
`);

// Budgets (month-wise)
db.run(`
CREATE TABLE IF NOT EXISTS budget (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  month TEXT,
  amount INTEGER
)
`);

// Expenses
db.run(`
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT,
  category TEXT,
  amount INTEGER,
  date TEXT
)
`);

// ---------- AUTH MIDDLEWARE ----------

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send({ error: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).send({ error: "Invalid token" });
  }
}

// ---------- AUTH ROUTES ----------

// Signup
app.post("/signup", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, password],
    function (err) {
      if (err) {
        return res.status(400).send({ error: "User already exists" });
      }
      res.send({ message: "Signup successful" });
    }
  );
});


// Login
app.post("/login", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  db.get(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password],
    (err, user) => {
      if (!user) {
        return res.status(401).send({ error: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1d" });
      res.send({ token });
    }
  );
});


// ---------- BUDGET ROUTES ----------

// Set monthly budget
app.post("/budget", auth, (req, res) => {
  const { month, amount } = req.body;
  const userId = req.userId;

  db.run(
    "DELETE FROM budget WHERE user_id=? AND month=?",
    [userId, month],
    () => {
      db.run(
        "INSERT INTO budget (user_id, month, amount) VALUES (?, ?, ?)",
        [userId, month, amount],
        () => res.send({ message: "Monthly budget saved" })
      );
    }
  );
});

// Get monthly budget
app.get("/budget/:month", auth, (req, res) => {
  const { month } = req.params;
  const userId = req.userId;

  db.get(
    "SELECT amount FROM budget WHERE user_id=? AND month=?",
    [userId, month],
    (err, row) => {
      res.send(row || { amount: 0 });
    }
  );
});

// ---------- EXPENSE ROUTES ----------

// Add expense
app.post("/expense", auth, (req, res) => {
  const { title, category, amount, date } = req.body;
  const userId = req.userId;

  db.run(
    "INSERT INTO expenses (user_id, title, category, amount, date) VALUES (?, ?, ?, ?, ?)",
    [userId, title, category, amount, date],
    () => res.send({ message: "Expense added" })
  );
});

// Get expenses by month
app.get("/expenses/:month", auth, (req, res) => {
  const { month } = req.params;
  const userId = req.userId;

  db.all(
    `
    SELECT * FROM expenses 
    WHERE user_id=? AND substr(date,1,7)=?
    `,
    [userId, month],
    (err, rows) => res.send(rows)
  );
});

// ---------- FRONTEND ROUTES ----------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// ---------- START SERVER ----------

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

app.get("/dev/reset-users", (req, res) => {
  db.run("DELETE FROM users", () => {
    res.send("All users deleted");
  });
});
