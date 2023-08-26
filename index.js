const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

// create USER API
app.post("/users/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT * FROM user WHERE username = '${username}';

  `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    // create user in user table
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'  
    );`;

    await db.run(createUserQuery);
    res.send("User Created Successfully");
  } else {
    // send invalid userDetails as response

    res.status(400);
    res.send("username already exists");
  }
});

app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `
    SELECT * FROM user 
    WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    // user Doesn't exist
    res.status(400);
    res.send("Invalid User");
  } else {
    const passwordMatched = await bcrypt.compare(password, dbUser.password);
    if (passwordMatched === true) {
      res.send("Login Successful");
    } else {
      res.status(400);
      res.send("Invalid Password");
    }
  }
});
