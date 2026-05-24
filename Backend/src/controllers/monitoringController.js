const db = require("../config/db");

// ============================================
// GET MONITORING DATA
// ============================================

const getMonitoringData = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        timestamp,
        segment_id,
        pressure,
        flow_rate,
        temperature,
        pump_speed,
        prediction,
        severity,
        reason,
        impact_analysis,
        recommendation
      FROM monitoring_result
      ORDER BY timestamp DESC
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Failed get monitoring data",
        });
      }

      const formatted = result.map((item) => ({
        ...item,

        insight: {
          reason: item.reason,
          impact: item.impact_analysis,
          solution: item.recommendation,
        },
      }));

      res.status(200).json({
        success: true,
        data: formatted,
      });
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  getMonitoringData,
};