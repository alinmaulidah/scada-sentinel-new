const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = mysql.createPool({
  host: 'localhost', user: 'root', password: '', database: 'scada-sentinel'
});

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: "User tidak ditemukan" });

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: rows[0].id, role: rows[0].role }, 
      'secret_key', 
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      user: { username: rows[0].username, role: rows[0].role } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};