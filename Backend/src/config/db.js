const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Default XAMPP
  password: '',      // Default XAMPP kosong
  database: 'scada-sentinel', // Ganti dengan nama database kamu
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db.promise();