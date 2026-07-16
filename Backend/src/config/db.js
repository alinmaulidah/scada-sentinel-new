const mysql = require("mysql2/promise");
const { database } = require("./env");

const db = mysql.createPool({
  ...database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
