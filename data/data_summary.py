import os
import sys
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
import numpy as np
from collections import defaultdict

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    logging.error("MONGO_URI is not set in .env")
    sys.exit(1)

try:
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
    properties_collection = db["properties"]
    logging.info("Connected to MongoDB")
except Exception as e:
    logging.error("Error connecting to MongoDB: %s", e)
    sys.exit(1)


def compute_summary():
    prices = []
    total_count = 0
    city_stats = defaultdict(lambda: {"prices": [], "count": 0})

    for prop in properties_collection.find({}, {"price": 1, "city": 1}):
        total_count += 1
        price_val = prop.get("price", 0)
        try:
            price = float(price_val)
            prices.append(price)
            # Group by city (use "Unknown" if city field is missing or empty)
            city = prop.get("city") or "Unknown"
            city_stats[city]["prices"].append(price)
            city_stats[city]["count"] += 1
        except (ValueError, TypeError):
            continue

    print("Overall Property Summary:")
    print("-------------------------")
    print(f"Total properties: {total_count}")

    if prices:
        prices_array = np.array(prices)
        avg_price = np.mean(prices_array)
        median_price = np.median(prices_array)
        std_price = np.std(prices_array)
        min_price = np.min(prices_array)
        max_price = np.max(prices_array)
        perc_25 = np.percentile(prices_array, 25)
        perc_75 = np.percentile(prices_array, 75)

        print(f"Average price   : ${avg_price:,.2f}")
        print(f"Median price    : ${median_price:,.2f}")
        print(f"Standard Deviation: ${std_price:,.2f}")
        print(f"Price range     : ${min_price:,.2f} - ${max_price:,.2f}")
        print(f"25th percentile : ${perc_25:,.2f}")
        print(f"75th percentile : ${perc_75:,.2f}")
    else:
        print("No valid price data found.")

    print("\nProperty Summary by City:")
    print("-------------------------")
    for city, stats in city_stats.items():
        count = stats["count"]
        if stats["prices"]:
            city_prices = np.array(stats["prices"])
            avg = np.mean(city_prices)
            med = np.median(city_prices)
            std = np.std(city_prices)
            mini = np.min(city_prices)
            maxi = np.max(city_prices)
            print(f"City: {city}")
            print(f"  Count           : {count}")
            print(f"  Avg Price       : ${avg:,.2f}")
            print(f"  Median Price    : ${med:,.2f}")
            print(f"  Price Range     : ${mini:,.2f} - ${maxi:,.2f}")
            print(f"  Std Deviation   : ${std:,.2f}")
        else:
            print(f"City: {city} has no valid price data.")
        print()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    compute_summary()
    client.close()
