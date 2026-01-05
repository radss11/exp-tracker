const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Redirect root to login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Database
const db = new sqlite3.Database("database.db");

// USERS TABLE
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

// EXPENSES TABLE
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

// MONTH-WISE BUDGET TABLE
db.run(`
  CREATE TABLE IF NOT EXISTS budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    month TEXT,
    amount INTEGER
  )
`);

/* ---------------- AUTH ---------------- */

// SIGNUP
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    function (err) {
      if (err) {
        return res.status(400).send({ message: "User already exists" });
      }
      res.send({ userId: this.lastID });
    }
  );
});

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (!row) {
        return res.status(401).send({ message: "Invalid credentials" });
      }
      res.send({ userId: row.id });
    }
  );
});

/* ---------------- BUDGET ---------------- */

// SET MONTHLY BUDGET
app.post("/budget", (req, res) => {
  const { userId, month, amount } = req.body;

  if (!userId || !month || !amount) {
    return res.status(400).send({ message: "Missing budget data" });
  }

  db.run(
    "DELETE FROM budget WHERE user_id=? AND month=?",
    [userId, month],
    () => {
      db.run(
        "INSERT INTO budget (user_id, month, amount) VALUES (?, ?, ?)",
        [userId, month, amount],
        () => {
          res.send({ message: "Monthly budget set" });
        }
      );
    }
  );
});

// GET MONTHLY BUDGET
app.get("/budget/:userId/:month", (req, res) => {
  const { userId, month } = req.params;

  db.get(
    "SELECT amount FROM budget WHERE user_id=? AND month=?",
    [userId, month],
    (err, row) => {
      res.send(row || { amount: 0 });
    }
  );
});

/* ---------------- EXPENSES ---------------- */

// ADD EXPENSE
app.post("/expense", (req, res) => {
  const { title, category, amount, date, userId } = req.body;

  db.run(
    "INSERT INTO expenses (title, category, amount, date, user_id) VALUES (?, ?, ?, ?, ?)",
    [title, category, amount, date, userId],
    () => {
      res.send({ message: "Expense added" });
    }
  );
});

// GET USER EXPENSES
app.get("/expenses/:userId", (req, res) => {
  const userId = req.params.userId;

  db.all(
    "SELECT * FROM expenses WHERE user_id=?",
    [userId],
    (err, rows) => {
      res.send(rows);
    }
  );
});

/* ---------------- SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
