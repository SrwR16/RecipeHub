import logging
import math
from decimal import Decimal
from typing import Dict, List, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class GoogleMapsAPIError(Exception):
    """Custom exception for Google Maps API errors"""

    pass


class GoogleMapsService:
    """Service class for Google Maps API interactions"""

    def __init__(self):
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        self.places_api_key = settings.GOOGLE_PLACES_API_KEY
        self.base_url = "https://maps.googleapis.com/maps/api"

    def geocode_address(self, address: str) -> Optional[Dict]:
        """
        Geocode an address to get latitude and longitude
        """
        url = f"{self.base_url}/geocode/json"
        params = {"address": address, "key": self.api_key}

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "OK" and data["results"]:
                result = data["results"][0]
                location = result["geometry"]["location"]

                return {
                    "latitude": Decimal(str(location["lat"])),
                    "longitude": Decimal(str(location["lng"])),
                    "formatted_address": result["formatted_address"],
                    "place_id": result.get("place_id"),
                    "address_components": result.get("address_components", []),
                }
            else:
                logger.warning(
                    f"Geocoding failed for address '{address}': {data['status']}"
                )
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error geocoding address '{address}': {e}")
            raise GoogleMapsAPIError(f"Geocoding failed: {e}")

    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict]:
        """
        Reverse geocode coordinates to get address information
        """
        url = f"{self.base_url}/geocode/json"
        params = {"latlng": f"{latitude},{longitude}", "key": self.api_key}

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "OK" and data["results"]:
                result = data["results"][0]

                return {
                    "formatted_address": result["formatted_address"],
                    "place_id": result.get("place_id"),
                    "address_components": result.get("address_components", []),
                }
            else:
                logger.warning(
                    f"Reverse geocoding failed for {latitude},{longitude}: {data['status']}"
                )
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error reverse geocoding {latitude},{longitude}: {e}")
            raise GoogleMapsAPIError(f"Reverse geocoding failed: {e}")

    def search_nearby_places(
        self,
        latitude: float,
        longitude: float,
        radius: int = 5000,
        place_type: str = None,
        keyword: str = None,
    ) -> List[Dict]:
        """
        Search for nearby places using Google Places API
        """
        url = f"{self.base_url}/place/nearbysearch/json"
        params = {
            "location": f"{latitude},{longitude}",
            "radius": radius,
            "key": self.places_api_key,
        }

        if place_type:
            params["type"] = place_type
        if keyword:
            params["keyword"] = keyword

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "OK":
                return self._process_places_results(data["results"])
            else:
                logger.warning(f"Nearby places search failed: {data['status']}")
                return []

        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching nearby places: {e}")
            raise GoogleMapsAPIError(f"Nearby places search failed: {e}")

    def text_search_places(
        self,
        query: str,
        latitude: float = None,
        longitude: float = None,
        radius: int = None,
    ) -> List[Dict]:
        """
        Search for places using text query
        """
        url = f"{self.base_url}/place/textsearch/json"
        params = {"query": query, "key": self.places_api_key}

        if latitude and longitude:
            params["location"] = f"{latitude},{longitude}"
        if radius:
            params["radius"] = radius

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "OK":
                return self._process_places_results(data["results"])
            else:
                logger.warning(
                    f"Text search failed for query '{query}': {data['status']}"
                )
                return []

        except requests.exceptions.RequestException as e:
            logger.error(f"Error searching places with query '{query}': {e}")
            raise GoogleMapsAPIError(f"Text search failed: {e}")

    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific place
        """
        url = f"{self.base_url}/place/details/json"
        params = {
            "place_id": place_id,
            "fields": (
                "place_id,name,formatted_address,geometry,formatted_phone_number,"
                "website,rating,user_ratings_total,price_level,opening_hours,"
                "photos,reviews,types,business_status"
            ),
            "key": self.places_api_key,
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if data["status"] == "OK":
                return self._process_place_details(data["result"])
            else:
                logger.warning(
                    f"Place details failed for place_id '{place_id}': {data['status']}"
                )
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting place details for '{place_id}': {e}")
            raise GoogleMapsAPIError(f"Place details failed: {e}")

    def _process_places_results(self, results: List[Dict]) -> List[Dict]:
        """
        Process and normalize places search results
        """
        processed_results = []

        for place in results:
            processed_place = {
                "google_place_id": place.get("place_id"),
                "name": place.get("name"),
                "address": place.get("vicinity") or place.get("formatted_address"),
                "latitude": Decimal(str(place["geometry"]["location"]["lat"])),
                "longitude": Decimal(str(place["geometry"]["location"]["lng"])),
                "google_rating": place.get("rating"),
                "google_reviews_count": place.get("user_ratings_total", 0),
                "price_level": place.get("price_level"),
                "place_types": place.get("types", []),
                "photos": self._process_photos(place.get("photos", [])),
                "business_status": place.get("business_status"),
                "opening_hours": place.get("opening_hours", {}),
            }
            processed_results.append(processed_place)

        return processed_results

    def _process_place_details(self, place: Dict) -> Dict:
        """
        Process and normalize place details
        """
        return {
            "google_place_id": place.get("place_id"),
            "name": place.get("name"),
            "address": place.get("formatted_address"),
            "latitude": Decimal(str(place["geometry"]["location"]["lat"])),
            "longitude": Decimal(str(place["geometry"]["location"]["lng"])),
            "phone_number": place.get("formatted_phone_number"),
            "website": place.get("website"),
            "google_rating": place.get("rating"),
            "google_reviews_count": place.get("user_ratings_total", 0),
            "price_level": place.get("price_level"),
            "place_types": place.get("types", []),
            "photos": self._process_photos(place.get("photos", [])),
            "reviews": place.get("reviews", []),
            "opening_hours": self._process_opening_hours(
                place.get("opening_hours", {})
            ),
            "business_status": place.get("business_status"),
        }

    def _process_photos(self, photos: List[Dict]) -> List[str]:
        """
        Process place photos and return photo URLs
        """
        photo_urls = []
        for photo in photos[:5]:  # Limit to 5 photos
            photo_reference = photo.get("photo_reference")
            if photo_reference:
                photo_url = (
                    f"{self.base_url}/place/photo?"
                    f"maxwidth=400&photoreference={photo_reference}&key={self.places_api_key}"
                )
                photo_urls.append(photo_url)
        return photo_urls

    def _process_opening_hours(self, opening_hours: Dict) -> Dict:
        """
        Process opening hours information
        """
        if not opening_hours:
            return {}

        return {
            "open_now": opening_hours.get("open_now"),
            "weekday_text": opening_hours.get("weekday_text", []),
            "periods": opening_hours.get("periods", []),
        }


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)
    Returns distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return round(c * r, 2)


def get_location_from_coordinates(latitude, longitude):
    """
    Get address information from coordinates using Nominatim (OpenStreetMap)
    Free service, no API key required
    """
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": latitude,
            "lon": longitude,
            "zoom": 18,
            "addressdetails": 1,
        }
        headers = {"User-Agent": "RecipeHub-FoodMap/1.0"}

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()

        if "address" in data:
            address = data["address"]

            # Extract location components
            street_number = address.get("house_number", "")
            street_name = address.get("road", "")
            neighborhood = address.get("neighbourhood", address.get("suburb", ""))
            city = address.get("city", address.get("town", address.get("village", "")))
            state = address.get("state", "")
            country = address.get("country", "")
            postal_code = address.get("postcode", "")

            # Build formatted address
            address_parts = []
            if street_number and street_name:
                address_parts.append(f"{street_number} {street_name}")
            elif street_name:
                address_parts.append(street_name)

            if neighborhood:
                address_parts.append(neighborhood)
            if city:
                address_parts.append(city)
            if state:
                address_parts.append(state)
            if postal_code:
                address_parts.append(postal_code)
            if country:
                address_parts.append(country)

            formatted_address = ", ".join(filter(None, address_parts))

            return {
                "formatted_address": formatted_address
                or data.get("display_name", "Unknown location"),
                "street_address": f"{street_number} {street_name}".strip(),
                "neighborhood": neighborhood,
                "city": city,
                "state": state,
                "country": country,
                "postal_code": postal_code,
                "latitude": float(latitude),
                "longitude": float(longitude),
            }

    except Exception as e:
        print(f"Geocoding error: {e}")

    return {
        "formatted_address": f"{latitude}, {longitude}",
        "city": "Unknown",
        "country": "Unknown",
        "latitude": float(latitude),
        "longitude": float(longitude),
    }


def get_coordinates_from_address(address):
    """
    Get coordinates from address using Nominatim (OpenStreetMap)
    """
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"format": "json", "q": address, "limit": 1, "addressdetails": 1}
        headers = {"User-Agent": "RecipeHub-FoodMap/1.0"}

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()

        if data and len(data) > 0:
            result = data[0]
            return {
                "latitude": float(result["lat"]),
                "longitude": float(result["lon"]),
                "formatted_address": result.get("display_name", address),
                "city": result.get("address", {}).get("city", ""),
                "country": result.get("address", {}).get("country", ""),
            }

    except Exception as e:
        print(f"Address geocoding error: {e}")

    return None


def find_nearby_locations(latitude, longitude, radius_km=5, location_type=None):
    """
    Find nearby locations using Overpass API (OpenStreetMap)
    location_type can be: restaurant, cafe, fast_food, etc.
    """
    try:
        # Overpass API query for nearby restaurants/food places
        overpass_url = "http://overpass-api.de/api/interpreter"

        # Convert radius to degrees (approximate)
        radius_deg = radius_km / 111.0  # 1 degree ≈ 111 km

        # Build query based on location type
        if location_type == "restaurant":
            amenity_filter = 'amenity="restaurant"'
        elif location_type == "cafe":
            amenity_filter = 'amenity="cafe"'
        elif location_type == "fast_food":
            amenity_filter = 'amenity="fast_food"'
        else:
            amenity_filter = 'amenity~"restaurant|cafe|fast_food|bar|pub"'

        query = f"""
        [out:json][timeout:25];
        (
          node[{amenity_filter}]({latitude-radius_deg},{longitude-radius_deg},{latitude+radius_deg},{longitude+radius_deg});
          way[{amenity_filter}]({latitude-radius_deg},{longitude-radius_deg},{latitude+radius_deg},{longitude+radius_deg});
          relation[{amenity_filter}]({latitude-radius_deg},{longitude-radius_deg},{latitude+radius_deg},{longitude+radius_deg});
        );
        out center meta;
        """

        response = requests.post(overpass_url, data=query, timeout=30)
        response.raise_for_status()

        data = response.json()
        locations = []

        for element in data.get("elements", []):
            # Get coordinates
            if element["type"] == "node":
                lat, lon = element["lat"], element["lon"]
            elif "center" in element:
                lat, lon = element["center"]["lat"], element["center"]["lon"]
            else:
                continue

            # Calculate distance
            distance = calculate_distance(latitude, longitude, lat, lon)
            if distance <= radius_km:
                tags = element.get("tags", {})
                locations.append(
                    {
                        "name": tags.get("name", "Unnamed location"),
                        "latitude": lat,
                        "longitude": lon,
                        "distance": distance,
                        "amenity": tags.get("amenity", ""),
                        "cuisine": tags.get("cuisine", ""),
                        "address": tags.get("addr:full", ""),
                        "phone": tags.get("phone", ""),
                        "website": tags.get("website", ""),
                        "opening_hours": tags.get("opening_hours", ""),
                    }
                )

        # Sort by distance
        locations.sort(key=lambda x: x["distance"])
        return locations[:20]  # Return top 20 closest

    except Exception as e:
        print(f"Nearby locations error: {e}")
        return []


def validate_coordinates(latitude, longitude):
    """
    Validate that coordinates are within valid ranges
    """
    try:
        lat = float(latitude)
        lon = float(longitude)

        if -90 <= lat <= 90 and -180 <= lon <= 180:
            return True, lat, lon
        else:
            return False, None, None
    except (ValueError, TypeError):
        return False, None, None


def get_user_location_context(latitude, longitude):
    """
    Get comprehensive location context for a user's position
    """
    location_info = get_location_from_coordinates(latitude, longitude)
    nearby_places = find_nearby_locations(latitude, longitude, radius_km=1)

    return {
        "user_location": location_info,
        "nearby_restaurants": nearby_places,
        "coordinates": {"latitude": float(latitude), "longitude": float(longitude)},
    }


# Legacy Google Maps functions for backward compatibility
def extract_address_components(address_components):
    """Legacy function for backward compatibility"""
    return {}


def determine_place_type(place_types):
    """Legacy function for backward compatibility"""
    return "restaurant"


# Initialize the service
google_maps_service = GoogleMapsService()
