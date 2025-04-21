export function regressionMetrics(actual, predicted) {
  const n = actual.length;
  const mse = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0) / n;
  const mae = actual.reduce((s, a, i) => s + Math.abs(a - predicted[i]), 0) / n;
  const meanA = actual.reduce((s, v) => s + v, 0) / n;
  const ssTot = actual.reduce((s, v) => s + (v - meanA) ** 2, 0);
  const ssRes = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  return { mse, mae, r2 };
}
