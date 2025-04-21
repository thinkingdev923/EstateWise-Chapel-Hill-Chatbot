function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

export function silhouetteScore(data, labels) {
  const n = data.length;
  const byCluster = {};
  labels.forEach((c, i) => (byCluster[c] = (byCluster[c] || []).concat(i)));

  const scores = data.map((pt, i) => {
    const own = labels[i];
    // a = avg intra‑cluster distance
    const a =
      byCluster[own]
        .filter((j) => j !== i)
        .reduce((sum, j) => sum + euclidean(pt, data[j]), 0) /
      Math.max(1, byCluster[own].length - 1);
    // b = lowest avg distance to points in any other cluster
    const b = Math.min(
      ...Object.entries(byCluster)
        .filter(([c]) => c != own)
        .map(
          ([, idxs]) =>
            idxs.reduce((s, j) => s + euclidean(pt, data[j]), 0) / idxs.length,
        ),
    );
    return (b - a) / Math.max(a, b);
  });

  return scores.reduce((s, v) => s + v, 0) / n;
}

export function daviesBouldinIndex(data, labels) {
  const byCluster = {};
  labels.forEach((c, i) => (byCluster[c] = (byCluster[c] || []).concat(i)));
  const centroids = Object.fromEntries(
    Object.entries(byCluster).map(([c, idxs]) => {
      const dims = data[0].length;
      const sum = Array(dims).fill(0);
      idxs.forEach((i) => data[i].forEach((v, d) => (sum[d] += v)));
      return [c, sum.map((v) => v / idxs.length)];
    }),
  );
  const S = Object.fromEntries(
    Object.entries(byCluster).map(([c, idxs]) => {
      const cent = centroids[c];
      return [
        c,
        Math.sqrt(
          idxs.reduce((s, i) => s + euclidean(data[i], cent) ** 2, 0) /
            idxs.length,
        ),
      ];
    }),
  );
  const dbs = Object.keys(byCluster).map((c1) => {
    return Math.max(
      ...Object.keys(byCluster)
        .filter((c2) => c2 !== c1)
        .map((c2) => (S[c1] + S[c2]) / euclidean(centroids[c1], centroids[c2])),
    );
  });
  return dbs.reduce((s, v) => s + v, 0) / dbs.length;
}
