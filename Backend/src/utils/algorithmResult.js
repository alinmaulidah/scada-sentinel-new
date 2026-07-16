const parseJsonArray = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toNumber = (value) => Number(value) || 0;

const mapAlgorithmResult = (result, includeCreatedAt = false) => {
  const mapped = {
    id: result.id,
    algorithm: result.algorithm,
    normalization: result.normalization,
    cluster: result.cluster,
    eps: result.eps,
    min_samples: result.min_samples,
    anomaly: toNumber(result.anomaly),
    normal: toNumber(result.normal),
    silhouette: toNumber(result.silhouette),
    davies_bouldin: toNumber(result.davies_bouldin),
    accuracy: toNumber(result.accuracy),
    precision_score: toNumber(result.precision_score),
    recall_score: toNumber(result.recall_score),
    f1_score: toNumber(result.f1_score),
    status: result.status || "Done",
    anomaly_details: parseJsonArray(result.anomaly_details),
    normal_details: parseJsonArray(result.normal_details),
  };

  return includeCreatedAt ? { ...mapped, created_at: result.created_at } : mapped;
};

module.exports = { mapAlgorithmResult, parseJsonArray };
