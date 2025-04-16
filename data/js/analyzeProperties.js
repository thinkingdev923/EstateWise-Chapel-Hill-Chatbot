require("dotenv").config();
const mongoose = require("mongoose");

// Create a simple schema for properties (you can import your existing model if available)
const propertySchema = new mongoose.Schema({}, { strict: false });
const Property = mongoose.model("Property", propertySchema, "properties");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not defined in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    runAnalytics();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  });

async function runAnalytics() {
  try {
    // Average price per city
    const avgPricePerCity = await Property.aggregate([
      {
        $group: {
          _id: "$city",
          avgPrice: { $avg: "$price" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgPrice: -1 } },
    ]);
    console.log("Average Price per City:");
    console.table(avgPricePerCity);

    // Distribution of properties by number of bedrooms
    const bedroomsDistribution = await Property.aggregate([
      { $group: { _id: "$bedrooms", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    console.log("Distribution by Bedrooms:");
    console.table(bedroomsDistribution);
  } catch (error) {
    console.error("Error during analytics", error);
  } finally {
    mongoose.connection.close();
  }
}
