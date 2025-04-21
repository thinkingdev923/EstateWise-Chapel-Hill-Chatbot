export function zScoreOutliers(records, feature, threshold = 3) {
  const vals = records.map((r) => r[feature]).filter((v) => !isNaN(v));
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std = Math.sqrt(
    vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length,
  );

  return records.filter((r) => Math.abs((r[feature] - mean) / std) > threshold);
}

export function iqrOutliers(records, feature, multiplier = 1.5) {
  const sorted = records
    .map((r) => r[feature])
    .filter((v) => !isNaN(v))
    .sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length / 4)];
  const q3 = sorted[Math.ceil((sorted.length * 3) / 4)];
  const iqr = q3 - q1;
  const lower = q1 - multiplier * iqr;
  const upper = q3 + multiplier * iqr;
  return records.filter((r) => r[feature] < lower || r[feature] > upper);
}
