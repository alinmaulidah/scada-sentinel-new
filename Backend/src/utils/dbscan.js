/**
 * UTILS/DBSCAN.JS
 */

// 1. Fungsi Normalisasi (Wajib agar skala sensor seragam)
const normalizeZScore = (data) => {
  if (!data.length) return [];
  const numFeatures = data[0].length;
  const normalized = [];
  const stats = [];

  for (let j = 0; j < numFeatures; j++) {
    const column = data.map(row => row[j]);
    const mean = column.reduce((a, b) => a + b) / column.length;
    const stdDev = Math.sqrt(column.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / column.length);
    stats.push({ mean, stdDev });
  }

  for (let i = 0; i < data.length; i++) {
    normalized[i] = data[i].map((val, j) => (val - stats[j].mean) / (stats[j].stdDev || 1));
  }
  return normalized;
};

// 2. Jarak Euclidean
const euclideanDistance = (p1, p2) => {
  return Math.sqrt(p1.reduce((sum, val, i) => sum + Math.pow(val - p2[i], 2), 0));
};

// 3. Cari Tetangga
const getNeighbors = (dataset, pointIdx, epsilon) => {
  const neighbors = [];
  for (let i = 0; i < dataset.length; i++) {
    if (euclideanDistance(dataset[pointIdx], dataset[i]) <= epsilon) {
      neighbors.push(i);
    }
  }
  return neighbors;
};

// 4. Inti Algoritma DBSCAN
const dbscanCore = (dataset, epsilon, minPts) => {
  const size = dataset.length;
  const labels = new Array(size).fill(null);
  let clusterId = 0;

  for (let i = 0; i < size; i++) {
    if (labels[i] !== null) continue;
    const neighbors = getNeighbors(dataset, i, epsilon);

    if (neighbors.length < minPts) {
      labels[i] = -1; // Mark sebagai Noise sementara
    } else {
      labels[i] = clusterId;
      const queue = [...neighbors];
      const selfIdx = queue.indexOf(i);
      if (selfIdx > -1) queue.splice(selfIdx, 1);

      let head = 0;
      while (head < queue.length) {
        const neighborIdx = queue[head];
        if (labels[neighborIdx] === -1) labels[neighborIdx] = clusterId;
        if (labels[neighborIdx] === null) {
          labels[neighborIdx] = clusterId;
          const nextNeighbors = getNeighbors(dataset, neighborIdx, epsilon);
          if (nextNeighbors.length >= minPts) {
            for (const nextIdx of nextNeighbors) {
              if (!queue.includes(nextIdx)) queue.push(nextIdx);
            }
          }
        }
        head++;
      }
      clusterId++;
    }
  }
  return labels;
};

// 5. Fungsi Wrapper (Inilah yang diexport)
const runAnomalyDetection = (rawData, epsilon, minPts) => {
  const normalizedData = normalizeZScore(rawData);
  const labels = dbscanCore(normalizedData, epsilon, minPts);

  return normalizedData.map((_, i) => {
    const neighbors = getNeighbors(normalizedData, i, epsilon);
    const totalNeighbors = neighbors.length;

    let status = "NORMAL";
    if (labels[i] === -1) {
      status = totalNeighbors > 1 ? "WARNING" : "ANOMALI";
    }

    return {
      label: labels[i],
      status: status,
      neighborCount: totalNeighbors
    };
  });
};

module.exports = runAnomalyDetection;