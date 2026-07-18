const fs = require("fs");
const path = require("path");
const XLSX = require("../Frontend/node_modules/xlsx");

const sourcePath = path.resolve(__dirname, "..", "dataset-pipeline.xlsx");
const outputPath = path.resolve(__dirname, "..", "scada_stratified_500_seed42.xlsx");
const sampleSize = 500;
const seed = 42;

const random = (() => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
})();

const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};

const formatTimestamp = (value) => {
  if (typeof value !== "number") return String(value);
  const date = XLSX.SSF.parse_date_code(value);
  return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")} ${String(date.H).padStart(2, "0")}:${String(date.M).padStart(2, "0")}:${String(date.S).padStart(2, "0")}`;
};

const workbook = XLSX.readFile(sourcePath);
const sourceRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: null, raw: true })
  .map((row, source_index) => ({ ...row, timestamp: formatTimestamp(row.timestamp), source_index }));

if (sourceRows.length < sampleSize) {
  throw new Error(`Sumber hanya memiliki ${sourceRows.length} baris; tidak dapat mengambil sampel ${sampleSize}.`);
}

const groups = new Map();
for (const row of sourceRows) {
  const group = String(row.event_type || "unknown").toLowerCase();
  groups.set(group, [...(groups.get(group) || []), row]);
}

const quotas = [...groups.entries()].map(([group, rows]) => ({
  group,
  rows,
  exact: (rows.length / sourceRows.length) * sampleSize,
}));
let assigned = 0;
for (const quota of quotas) {
  quota.size = Math.floor(quota.exact);
  assigned += quota.size;
}
quotas
  .sort((left, right) => (right.exact - Math.floor(right.exact)) - (left.exact - Math.floor(left.exact)) || left.group.localeCompare(right.group))
  .slice(0, sampleSize - assigned)
  .forEach((quota) => { quota.size += 1; });

const sampledRows = quotas
  .flatMap((quota) => shuffle(quota.rows).slice(0, quota.size))
  .sort((left, right) => left.source_index - right.source_index)
  .map(({ source_index, ...row }) => row);

const outputSheet = XLSX.utils.json_to_sheet(sampledRows);
const outputWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, "SCADA Sample");
XLSX.writeFile(outputWorkbook, outputPath);

const summary = Object.fromEntries(quotas.sort((left, right) => left.group.localeCompare(right.group)).map((quota) => [quota.group, quota.size]));
fs.writeFileSync(
  outputPath.replace(/\.xlsx$/, ".metadata.json"),
  JSON.stringify({ source: path.basename(sourcePath), output: path.basename(outputPath), seed, method: "random stratified sampling by event_type", source_rows: sourceRows.length, sample_rows: sampledRows.length, strata: summary }, null, 2)
);

console.log(JSON.stringify({ output: outputPath, source_rows: sourceRows.length, sample_rows: sampledRows.length, seed, strata: summary }, null, 2));
