import * as tf from "@tensorflow/tfjs-node";
import { computeFeatures } from "./featureEngineering";

export async function trainPriceModel(
  rawRecords,
  { epochs = 40, batchSize = 32, lr = 0.01, verbose = 1 } = {},
) {
  // 1) feature-engineer
  const data = computeFeatures(rawRecords);
  const X = data.map((d) => [
    d.pricePerSqft,
    d.age,
    d.bedroomBathRatio,
    d.priceAreaInteraction,
  ]);
  const y = data.map((d) => d.logPrice);

  // 2) tf tensors
  const xs = tf.tensor2d(X);
  const ys = tf.tensor2d(y, [y.length, 1]);

  // 3) model
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [4], units: 64, activation: "relu" }),
  );
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({
    optimizer: tf.train.adam(lr),
    loss: "meanSquaredError",
    metrics: ["mse"],
  });

  // 4) fit
  await model.fit(xs, ys, { epochs, batchSize, validationSplit: 0.2, verbose });
  return model;
}

export function predictPrice(model, newRecords) {
  const feats = computeFeatures(newRecords).map((d) => [
    d.pricePerSqft,
    d.age,
    d.bedroomBathRatio,
    d.priceAreaInteraction,
  ]);
  const preds = model.predict(tf.tensor2d(feats));
  return Array.from(preds.dataSync()).map((v) => Math.expm1(v));
}
