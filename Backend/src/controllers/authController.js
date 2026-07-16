const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { jwtExpiresIn, jwtSecret } = require("../config/env");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  try {
    const [rows] = await db.execute(
      "SELECT id, username, password, role FROM users WHERE username = ?",
      [username]
    );
    if (rows.length === 0) return res.status(401).json({ message: "User tidak ditemukan" });

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: rows[0].id, role: rows[0].role }, 
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.json({ 
      token, 
      user: { id: rows[0].id, username: rows[0].username, role: rows[0].role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
