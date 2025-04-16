import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables.
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    logging.error("MONGO_URI is not set in .env")
    exit(1)

client = MongoClient(MONGO_URI)
db = client.get_default_database()
properties_collection = db["properties"]


def analyze_properties():
    """
    Aggregates property data by city and prints average, min, and max prices along with document counts.
    """
    pipeline = [
        {
            "$group": {
                "_id": "$city",
                "averagePrice": {"$avg": "$price"},
                "minPrice": {"$min": "$price"},
                "maxPrice": {"$max": "$price"},
                "count": {"$sum": 1}
            }
        },
        { "$sort": { "averagePrice": -1 } }
    ]

    results = properties_collection.aggregate(pipeline)
    print("Property Analysis by City:")
    for result in results:
        city = result["_id"] or "Unknown"
        avg_price = result["averagePrice"]
        min_price = result["minPrice"]
        max_price = result["maxPrice"]
        count = result["count"]
        print(f"City: {city}, Count: {count}, Avg Price: ${avg_price:.2f}, Min Price: ${min_price}, Max Price: ${max_price}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    analyze_properties()
    client.close()
