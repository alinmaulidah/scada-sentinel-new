const test = require("node:test");
const assert = require("node:assert/strict");
const { mapAlgorithmResult, parseJsonArray } = require("../src/utils/algorithmResult");
const { getMonitoringInsight } = require("../src/utils/monitoringInsight");

test("parseJsonArray returns an empty array for invalid data", () => {
  assert.deepEqual(parseJsonArray("invalid-json"), []);
  assert.deepEqual(parseJsonArray('{"item":1}'), []);
});

test("mapAlgorithmResult normalizes persisted algorithm results", () => {
  const result = mapAlgorithmResult({
    id: 1,
    anomaly: "3",
    normal: null,
    silhouette: "0.61",
    anomaly_details: '[{"segment_id":7}]',
    normal_details: "invalid-json",
  });

  assert.equal(result.anomaly, 3);
  assert.equal(result.normal, 0);
  assert.equal(result.silhouette, 0.61);
  assert.deepEqual(result.anomaly_details, [{ segment_id: 7 }]);
  assert.deepEqual(result.normal_details, []);
});

test("monitoring insight uses one backend rule set", () => {
  const insight = getMonitoringInsight({ type: "leak", pressure: 2, flow_rate: 9 });

  assert.equal(insight.prediction, "Leak");
  assert.equal(insight.severity, "High");
});
