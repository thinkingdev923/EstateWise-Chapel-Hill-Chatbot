import json
import time
from datetime import datetime


def safe_str(val, fallback="Unknown"):
    if isinstance(val, str) and val.strip():
        return val.strip()
    return fallback


def safe_num(val, fallback=0, min_val=None, max_val=None):
    try:
        n = float(val)
    except (ValueError, TypeError):
        return fallback
    if (min_val is not None and n < min_val) or (max_val is not None and n > max_val):
        return fallback
    return n


def clean_document(doc):
    current_year = datetime.now().year
    year_built = safe_num(doc.get("yearBuilt"), 0)
    if year_built < 1800 or year_built > current_year + 1:
        year_built = 0

    address = doc.get("address", {})
    return {
        "zpid": safe_num(doc.get("zpid"), 0),
        "city": safe_str(doc.get("city"), "") or safe_str(address.get("city"), "Unknown"),
        "state": safe_str(doc.get("state"), "") or safe_str(address.get("state"), "Unknown"),
        "homeStatus": safe_str(doc.get("homeStatus")),
        "address": {
            "streetAddress": safe_str(address.get("streetAddress"), safe_str(doc.get("streetAddress"), "Unknown")),
            "city": safe_str(address.get("city"), safe_str(doc.get("city"), "Unknown")),
            "state": safe_str(address.get("state"), safe_str(doc.get("state"), "Unknown")),
            "zipcode": safe_str(address.get("zipcode"), safe_str(doc.get("zipcode"), "Unknown")),
            "neighborhood": address.get("neighborhood"),
            "community": address.get("community"),
            "subdivision": address.get("subdivision"),
        },
        "bedrooms": safe_num(doc.get("bedrooms"), 0, 0, 20),
        "bathrooms": safe_num(doc.get("bathrooms"), 0, 0, 20),
        "price": safe_num(doc.get("price"), 0, 10000, 10000000),
        "yearBuilt": year_built,
        "latitude": safe_num(doc.get("latitude"), 0),
        "longitude": safe_num(doc.get("longitude"), 0),
        "livingArea": safe_num(doc.get("livingArea"), 0, 100, 20000),
        "homeType": safe_str(doc.get("homeType")),
        "listingDataSource": safe_str(doc.get("listingDataSource"), "Legacy"),
        "description": safe_str(doc.get("description")),
    }


def create_metadata(clean_doc):
    """
    Convert the cleaned property document into metadata for upserting.
    Address is JSON-encoded.
    """
    return {
        "zpid": clean_doc["zpid"],
        "city": clean_doc["city"],
        "state": clean_doc["state"],
        "homeStatus": clean_doc["homeStatus"],
        "address": json.dumps(clean_doc["address"]),
        "bedrooms": clean_doc["bedrooms"],
        "bathrooms": clean_doc["bathrooms"],
        "price": clean_doc["price"],
        "yearBuilt": clean_doc["yearBuilt"],
        "latitude": clean_doc["latitude"],
        "longitude": clean_doc["longitude"],
        "livingArea": clean_doc["livingArea"],
        "homeType": clean_doc["homeType"],
        "listingDataSource": clean_doc["listingDataSource"],
        "description": clean_doc["description"],
    }
