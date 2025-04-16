import os
import csv
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables.
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    logging.error("MONGO_URI is not set in .env")
    exit(1)

# Connect to MongoDB.
client = MongoClient(MONGO_URI)
db = client.get_default_database()
properties_collection = db["properties"]


def export_properties_to_csv(filename):
    """
    Exports all property documents to a CSV file.
    """
    cursor = properties_collection.find({})
    fieldnames = [
        "zpid",
        "city",
        "state",
        "homeStatus",
        "address",
        "bedrooms",
        "bathrooms",
        "price",
        "yearBuilt",
        "latitude",
        "longitude",
        "livingArea",
        "homeType",
        "listingDataSource",
        "description"
    ]

    with open(filename, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for doc in cursor:
            # Convert 'address' from dict to string if necessary.
            if "address" in doc and isinstance(doc["address"], dict):
                doc["address"] = str(doc["address"])
            writer.writerow({k: doc.get(k, "") for k in fieldnames})

    print(f"Data exported successfully to {filename}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    export_properties_to_csv("properties_export.csv")
    client.close()
