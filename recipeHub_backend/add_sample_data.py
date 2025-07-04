#!/usr/bin/env python
"""
Script to add sample food places and categories for demonstration
"""

import os
import sys
from decimal import Decimal

import django

# Add the project root to the Python path
sys.path.append("/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "recipeHub_backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from food_map.models import FoodCategory, FoodPlace

User = get_user_model()


def create_sample_data():
    print("Creating sample food categories...")

    # Create food categories
    categories_data = [
        {
            "name": "Italian",
            "description": "Italian cuisine and restaurants",
            "icon": "fas fa-pizza-slice",
            "color": "#FF6B6B",
        },
        {
            "name": "Asian",
            "description": "Asian cuisine including Chinese, Japanese, Thai",
            "icon": "fas fa-bowl-food",
            "color": "#4ECDC4",
        },
        {
            "name": "American",
            "description": "American cuisine and burgers",
            "icon": "fas fa-hamburger",
            "color": "#45B7D1",
        },
        {
            "name": "Mexican",
            "description": "Mexican and Latin American cuisine",
            "icon": "fas fa-pepper-hot",
            "color": "#FFA07A",
        },
        {
            "name": "Cafes",
            "description": "Coffee shops and casual dining",
            "icon": "fas fa-coffee",
            "color": "#8D6E63",
        },
    ]

    created_categories = {}
    for cat_data in categories_data:
        category, created = FoodCategory.objects.get_or_create(
            name=cat_data["name"], defaults=cat_data
        )
        created_categories[cat_data["name"]] = category
        print(f"{'Created' if created else 'Found'} category: {category.name}")

    print("\nCreating sample food places...")

    # Get or create a user for the places
    user, created = User.objects.get_or_create(
        username="demo_user",
        defaults={
            "email": "demo@recipehub.com",
            "first_name": "Demo",
            "last_name": "User",
        },
    )
    print(f"{'Created' if created else 'Found'} demo user: {user.username}")

    # Sample places data (using NYC coordinates)
    places_data = [
        {
            "name": "Bella Vista Italian",
            "description": "Authentic Italian restaurant with fresh pasta and wood-fired pizza",
            "place_type": "restaurant",
            "address": "123 Little Italy St, New York, NY 10013",
            "latitude": Decimal("40.7188"),
            "longitude": Decimal("-73.9973"),
            "city": "New York",
            "country": "United States",
            "phone_number": "+1-212-555-0123",
            "website": "https://bellavista-nyc.com",
            "price_level": 3,
            "google_rating": Decimal("4.5"),
            "google_reviews_count": 127,
            "has_delivery": True,
            "has_takeout": True,
            "has_outdoor_seating": True,
            "is_wheelchair_accessible": True,
            "categories": ["Italian"],
        },
        {
            "name": "Dragon Garden Chinese",
            "description": "Traditional Chinese cuisine with modern presentation",
            "place_type": "restaurant",
            "address": "456 Chinatown Ave, New York, NY 10013",
            "latitude": Decimal("40.7158"),
            "longitude": Decimal("-73.9970"),
            "city": "New York",
            "country": "United States",
            "phone_number": "+1-212-555-0456",
            "price_level": 2,
            "google_rating": Decimal("4.2"),
            "google_reviews_count": 89,
            "has_delivery": True,
            "has_takeout": True,
            "categories": ["Asian"],
        },
        {
            "name": "Brooklyn Burger Co.",
            "description": "Gourmet burgers made with locally sourced ingredients",
            "place_type": "restaurant",
            "address": "789 Park Ave, Brooklyn, NY 11205",
            "latitude": Decimal("40.6892"),
            "longitude": Decimal("-73.9442"),
            "city": "Brooklyn",
            "country": "United States",
            "phone_number": "+1-718-555-0789",
            "website": "https://brooklynburger.co",
            "price_level": 2,
            "google_rating": Decimal("4.6"),
            "google_reviews_count": 203,
            "has_delivery": True,
            "has_takeout": True,
            "has_outdoor_seating": False,
            "is_wheelchair_accessible": True,
            "categories": ["American"],
        },
        {
            "name": "Café Central",
            "description": "Cozy coffee shop with artisanal pastries and specialty coffee",
            "place_type": "cafe",
            "address": "321 Fifth Ave, New York, NY 10016",
            "latitude": Decimal("40.7431"),
            "longitude": Decimal("-73.9808"),
            "city": "New York",
            "country": "United States",
            "phone_number": "+1-212-555-0321",
            "price_level": 1,
            "google_rating": Decimal("4.3"),
            "google_reviews_count": 67,
            "has_delivery": False,
            "has_takeout": True,
            "has_outdoor_seating": True,
            "is_wheelchair_accessible": True,
            "categories": ["Cafes"],
        },
        {
            "name": "Taco Libre",
            "description": "Authentic Mexican street food and fresh guacamole",
            "place_type": "restaurant",
            "address": "654 Broadway, New York, NY 10012",
            "latitude": Decimal("40.7250"),
            "longitude": Decimal("-73.9964"),
            "city": "New York",
            "country": "United States",
            "price_level": 1,
            "google_rating": Decimal("4.4"),
            "google_reviews_count": 156,
            "has_delivery": True,
            "has_takeout": True,
            "categories": ["Mexican"],
        },
    ]

    created_places = []
    for place_data in places_data:
        categories = place_data.pop("categories", [])

        place, created = FoodPlace.objects.get_or_create(
            name=place_data["name"],
            defaults={**place_data, "created_by": user, "is_verified": True},
        )

        # Add categories
        if categories and created:
            for cat_name in categories:
                if cat_name in created_categories:
                    place.categories.add(created_categories[cat_name])

        created_places.append(place)
        print(f"{'Created' if created else 'Found'} place: {place.name}")

    print("\nSample data creation complete!")
    print(
        f"Created {len(created_categories)} categories and {len(created_places)} places"
    )

    return created_categories, created_places


if __name__ == "__main__":
    create_sample_data()
