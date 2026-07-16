const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return res.status(401).json({ success: false, message: "Autentikasi diperlukan." });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Sesi tidak valid atau sudah berakhir." });
  }
};

module.exports = { requireAuth };
