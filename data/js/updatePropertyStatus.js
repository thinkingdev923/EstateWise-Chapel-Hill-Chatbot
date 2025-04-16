require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not defined in .env");
  process.exit(1);
}

const propertySchema = new mongoose.Schema(
  {
    price: Number,
    homeStatus: String,
  },
  { strict: false },
);
const Property = mongoose.model("Property", propertySchema, "properties");

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    return updateStatuses();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  });

async function updateStatuses() {
  try {
    // Define a threshold; properties below this price get updated.
    const DISCOUNT_THRESHOLD = 200000;
    const result = await Property.updateMany(
      { price: { $lt: DISCOUNT_THRESHOLD } },
      { $set: { homeStatus: "discounted" } },
    );
    console.log(
      `Matched: ${result.n ? result.n : result.matchedCount}, Modified: ${result.nModified ? result.nModified : result.modifiedCount}`,
    );
  } catch (error) {
    console.error("Error updating property statuses", error);
  } finally {
    mongoose.connection.close();
  }
}
