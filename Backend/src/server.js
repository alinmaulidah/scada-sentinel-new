const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const dataRoutes = require("./routes/dataRoutes");
const algoritmaRoutes = require("./routes/algoritmaRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");

const app = express();


// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json({
  limit: "50mb",
}));

app.use(express.urlencoded({
  extended: true,
  limit: "50mb",
}));


// ================= ROUTES =================

// AUTH
app.use("/api", authRoutes);

// DASHBOARD
app.use("/api", dashboardRoutes);

// DATA MANAGEMENT
app.use("/api", dataRoutes);

// ALGORITHM EXECUTION
app.use("/api/algoritma", algoritmaRoutes);

// MONITORING
app.use("/api/monitoring", monitoringRoutes);

// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});