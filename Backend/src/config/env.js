const isProduction = process.env.NODE_ENV === "production";

const requiredProductionVariables = [
  "JWT_SECRET",
  "CORS_ORIGIN",
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

if (isProduction) {
  const missing = requiredProductionVariables.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Environment production belum lengkap: ${missing.join(", ")}`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  pythonCommand: process.env.PYTHON_COMMAND || "python",
  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "scada-sentinel",
  },
};
