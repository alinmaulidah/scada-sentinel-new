const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

require("dotenv").config();
const { corsOrigin, port } = require("./config/env");
const { requireAuth } = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const dataRoutes = require("./routes/dataRoutes");
const algoritmaRoutes = require("./routes/algoritmaRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const algorithmResultsRoutes = require("./routes/algorithmResultsRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(morgan("dev"));

app.use(express.json({
  limit: "50mb",
}));

app.use(express.urlencoded({
  extended: true,
  limit: "50mb",
}));


app.use("/api", authRoutes);
app.use("/api", requireAuth);
app.use("/api", dashboardRoutes);
app.use("/api", dataRoutes);
app.use("/api/algoritma", algoritmaRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/algorithm_results", algorithmResultsRoutes);
app.use("/api", profileRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan." });
});

app.listen(port, () => {
  console.log(`SERVER RUNNING ON PORT ${port}`);
});
