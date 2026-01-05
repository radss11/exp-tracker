const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Database
const db = new sqlite3.Database("./database.db");

// Create tables
// Users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

// Budget table (linked to user)
db.run(`
  CREATE TABLE IF NOT EXISTS budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    month TEXT,
    amount INTEGER
  )
`);


// Expenses table (linked to user)
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
app.post("/login", (req, res) => {
  const { username, password } = req.body;  
  db.get(
    "SELECT id FROM users WHERE username = ? AND password = ?",
    [username, password],   
    (err, row) => {
      if (err || !row) {
        return res.status(400).send({ message: "Invalid credentials" });
      }   
      res.send({ userId: row.id });
    }
  );
});


app.post("/budget", (req, res) => {
  const { userId, month, amount } = req.body;

  db.run(
    "DELETE FROM budget WHERE user_id=? AND month=?",
    [userId, month]
  );

  db.run(
    "INSERT INTO budget (user_id, month, amount) VALUES (?, ?, ?)",
    [userId, month, amount]
  );

  res.send({ message: "Monthly budget set" });
});



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

app.post("/expense", (req, res) => {
  const { title, category, amount, date, userId } = req.body;

  db.run(
    "INSERT INTO expenses (user_id, title, category, amount, date) VALUES (?, ?, ?, ?, ?)",
    [userId, title, category, amount, date]
  );

  res.send({ message: "Expense added" });
});


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


// Monthly summary
app.get("/summary/:month", (req, res) => {
  const month = req.params.month;
  db.all(
    `SELECT category, SUM(amount) as total 
     FROM expenses 
     WHERE date LIKE ?
     GROUP BY category`,
    [`${month}%`],
    (err, rows) => {
      res.send(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
