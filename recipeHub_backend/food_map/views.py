import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.db.models.functions import Cos, Power, Radians, Sin
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    FoodCategory,
    FoodItem,
    FoodItemReview,
    SearchHistory,
    UserFavoriteFoodItem,
)
from .serializers import (
    CreateFoodItemReviewSerializer,
    CreateFoodItemSerializer,
    FoodCategorySerializer,
    FoodItemDetailSerializer,
    FoodItemListSerializer,
    FoodItemReviewSerializer,
    FoodItemSearchSerializer,
    NearbyFoodItemsSerializer,
    SearchHistorySerializer,
    UserFavoriteFoodItemSerializer,
)
from .utils import (
    get_coordinates_from_address,
    get_location_from_coordinates,
    get_user_location_context,
    validate_coordinates,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class StandardResultsPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def get_google_maps_api_key(request):
    """Return Google Maps API key for frontend"""
    return Response({"google_maps_api_key": settings.GOOGLE_MAPS_API_KEY})


class FoodCategoryListView(generics.ListAPIView):
    """List all food categories"""

    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    permission_classes = [permissions.AllowAny]


class FoodItemListCreateView(generics.ListCreateAPIView):
    """List and create food items"""

    pagination_class = StandardResultsPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = (
            FoodItem.objects.filter(is_active=True)
            .select_related("created_by", "category")
            .prefetch_related("images", "reviews")
        )

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__name__icontains=category)

        # Filter by food type
        food_type = self.request.query_params.get("food_type")
        if food_type:
            queryset = queryset.filter(food_type=food_type)

        # Filter by city
        city = self.request.query_params.get("city")
        if city:
            queryset = queryset.filter(city__icontains=city)

        # Search by name, description, or ingredients
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(ingredients__icontains=search)
                | Q(restaurant_name__icontains=search)
            )

        # Filter by dietary restrictions
        if self.request.query_params.get("is_vegetarian") == "true":
            queryset = queryset.filter(is_vegetarian=True)
        if self.request.query_params.get("is_vegan") == "true":
            queryset = queryset.filter(is_vegan=True)
        if self.request.query_params.get("is_gluten_free") == "true":
            queryset = queryset.filter(is_gluten_free=True)
        if self.request.query_params.get("is_halal") == "true":
            queryset = queryset.filter(is_halal=True)

        # Filter by price range
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Filter by availability
        availability = self.request.query_params.get("availability_status")
        if availability:
            queryset = queryset.filter(availability_status=availability)

        return queryset.order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateFoodItemSerializer
        return FoodItemListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()

        # Add user location for distance calculation
        user_lat = self.request.query_params.get("user_latitude")
        user_lng = self.request.query_params.get("user_longitude")
        if user_lat and user_lng:
            context["request"].user_location = {
                "latitude": user_lat,
                "longitude": user_lng,
            }

        return context

    def perform_create(self, serializer):
        """Auto-fill location details when creating food item"""
        latitude = serializer.validated_data.get("latitude")
        longitude = serializer.validated_data.get("longitude")

        if latitude and longitude:
            # Get location details from coordinates
            location_info = get_location_from_coordinates(latitude, longitude)

            # Auto-fill city and country if not provided
            if not serializer.validated_data.get("city") and location_info.get("city"):
                serializer.validated_data["city"] = location_info["city"]
            if not serializer.validated_data.get("country") and location_info.get(
                "country"
            ):
                serializer.validated_data["country"] = location_info["country"]

            # Auto-fill address if not provided
            if not serializer.validated_data.get("address") and location_info.get(
                "formatted_address"
            ):
                serializer.validated_data["address"] = location_info[
                    "formatted_address"
                ]

        serializer.save()


class FoodItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a food item"""

    queryset = FoodItem.objects.filter(is_active=True)
    serializer_class = FoodItemDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()

        # Add user location for distance calculation
        user_lat = self.request.query_params.get("user_latitude")
        user_lng = self.request.query_params.get("user_longitude")
        if user_lat and user_lng:
            context["request"].user_location = {
                "latitude": user_lat,
                "longitude": user_lng,
            }

        return context

    def perform_update(self, serializer):
        # Only allow the creator to update their food item
        if serializer.instance.created_by != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own food items.")
        serializer.save()

    def perform_destroy(self, instance):
        # Only allow the creator to delete their food item
        if instance.created_by != self.request.user:
            raise permissions.PermissionDenied(
                "You can only delete your own food items."
            )
        instance.is_active = False  # Soft delete
        instance.save()


class NearbyFoodItemsView(APIView):
    """Get food items within a specified radius (default 2km) with location context"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NearbyFoodItemsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user_lat = float(data["latitude"])
        user_lng = float(data["longitude"])
        radius = data.get("radius", 2000)  # Default 2km

        # Validate coordinates
        is_valid, lat, lng = validate_coordinates(user_lat, user_lng)
        if not is_valid:
            return Response(
                {"error": "Invalid coordinates provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get user location context (address, nearby places)
        location_context = get_user_location_context(lat, lng)

        # Calculate distance using Haversine formula in database
        earth_radius = 6371000  # Earth's radius in meters

        queryset = (
            FoodItem.objects.filter(is_active=True)
            .annotate(
                distance=earth_radius
                * 2
                * Sin(
                    Power(Sin((Radians(user_lat) - Radians("latitude")) / 2), 2)
                    + Cos(Radians(user_lat))
                    * Cos(Radians("latitude"))
                    * Power(Sin((Radians(user_lng) - Radians("longitude")) / 2), 2),
                    0.5,
                )
            )
            .filter(distance__lte=radius)
        )

        # Apply additional filters
        if data.get("category"):
            queryset = queryset.filter(category__name__icontains=data["category"])

        if data.get("food_type"):
            queryset = queryset.filter(food_type=data["food_type"])

        if data.get("max_price"):
            queryset = queryset.filter(price__lte=data["max_price"])

        if data.get("is_vegetarian"):
            queryset = queryset.filter(is_vegetarian=True)

        if data.get("is_vegan"):
            queryset = queryset.filter(is_vegan=True)

        if data.get("is_gluten_free"):
            queryset = queryset.filter(is_gluten_free=True)

        # Order by distance
        queryset = queryset.order_by("distance")

        # Add user location to context for serializer
        context = {"request": request}
        context["request"].user_location = {
            "latitude": user_lat,
            "longitude": user_lng,
        }

        # Save search history if user is authenticated
        if request.user.is_authenticated:
            SearchHistory.objects.create(
                user=request.user,
                query=f"Nearby search ({radius}m radius)",
                location=location_context["user_location"]["formatted_address"],
                latitude=user_lat,
                longitude=user_lng,
                results_count=queryset.count(),
            )

        serializer = FoodItemListSerializer(queryset, many=True, context=context)

        return Response(
            {
                "results": serializer.data,
                "count": queryset.count(),
                "radius": radius,
                "center": {"latitude": user_lat, "longitude": user_lng},
                "location_context": location_context,
                "search_area": {
                    "address": location_context["user_location"]["formatted_address"],
                    "city": location_context["user_location"]["city"],
                    "country": location_context["user_location"]["country"],
                },
            }
        )


class FoodItemSearchView(APIView):
    """Search for food items with location filtering and context"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = FoodItemSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        query = data["query"]

        # Base queryset
        queryset = FoodItem.objects.filter(is_active=True).filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(ingredients__icontains=query)
            | Q(restaurant_name__icontains=query)
            | Q(address__icontains=query)
        )

        location_context = None
        search_location = None

        # Add location-based filtering if provided
        if data.get("latitude") and data.get("longitude"):
            user_lat = float(data["latitude"])
            user_lng = float(data["longitude"])
            radius = data.get("radius", 5000)

            # Validate coordinates
            is_valid, lat, lng = validate_coordinates(user_lat, user_lng)
            if is_valid:
                # Get location context
                location_context = get_user_location_context(lat, lng)
                search_location = location_context["user_location"]["formatted_address"]

                # Filter by distance
                earth_radius = 6371000
                queryset = (
                    queryset.annotate(
                        distance=earth_radius
                        * 2
                        * Sin(
                            Power(Sin((Radians(user_lat) - Radians("latitude")) / 2), 2)
                            + Cos(Radians(user_lat))
                            * Cos(Radians("latitude"))
                            * Power(
                                Sin((Radians(user_lng) - Radians("longitude")) / 2), 2
                            ),
                            0.5,
                        )
                    )
                    .filter(distance__lte=radius)
                    .order_by("distance")
                )

                # Add user location to context
                context = {"request": request}
                context["request"].user_location = {
                    "latitude": user_lat,
                    "longitude": user_lng,
                }
            else:
                context = {"request": request}
                queryset = queryset.order_by("-created_at")
        else:
            context = {"request": request}
            queryset = queryset.order_by("-created_at")

        # Save search history if user is authenticated
        if request.user.is_authenticated:
            SearchHistory.objects.create(
                user=request.user,
                query=query,
                location=search_location or "",
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
                results_count=queryset.count(),
            )

        serializer = FoodItemListSerializer(queryset, many=True, context=context)

        response_data = {
            "results": serializer.data,
            "count": queryset.count(),
            "query": query,
        }

        if location_context:
            response_data["location_context"] = location_context

        return Response(response_data)


class FoodItemReviewListCreateView(generics.ListCreateAPIView):
    """List and create reviews for a food item"""

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        food_item_id = self.kwargs["food_item_id"]
        return (
            FoodItemReview.objects.filter(food_item_id=food_item_id, is_active=True)
            .select_related("user")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateFoodItemReviewSerializer
        return FoodItemReviewSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["food_item"] = get_object_or_404(
            FoodItem, id=self.kwargs["food_item_id"]
        )
        return context


class UserFavoriteFoodItemsListView(generics.ListAPIView):
    """List user's favorite food items"""

    serializer_class = UserFavoriteFoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        return (
            UserFavoriteFoodItem.objects.filter(user=self.request.user)
            .select_related("food_item")
            .prefetch_related("food_item__category", "food_item__images")
            .order_by("-created_at")
        )


class ToggleFavoriteFoodItemView(APIView):
    """Add or remove a food item from user's favorites"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, food_item_id):
        food_item = get_object_or_404(FoodItem, id=food_item_id, is_active=True)

        favorite, created = UserFavoriteFoodItem.objects.get_or_create(
            user=request.user,
            food_item=food_item,
        )

        if created:
            return Response(
                {"message": "Food item added to favorites", "is_favorite": True},
                status=status.HTTP_201_CREATED,
            )
        else:
            favorite.delete()
            return Response(
                {"message": "Food item removed from favorites", "is_favorite": False},
                status=status.HTTP_200_OK,
            )


class SearchHistoryListView(generics.ListAPIView):
    """List user's search history"""

    serializer_class = SearchHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsPagination

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )


# Enhanced utility views with real location services
class GeocodeAddressView(APIView):
    """Geocode an address to get real coordinates and location details"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        address = request.query_params.get("address")
        if not address:
            return Response(
                {"error": "address parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use real geocoding service
        result = get_coordinates_from_address(address)

        if result:
            return Response(result)
        else:
            return Response(
                {"error": "Address not found or geocoding service unavailable"},
                status=status.HTTP_404_NOT_FOUND,
            )


class ReverseGeocodeView(APIView):
    """Reverse geocode coordinates to get real address information"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        latitude = request.query_params.get("latitude")
        longitude = request.query_params.get("longitude")

        if not latitude or not longitude:
            return Response(
                {"error": "latitude and longitude parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate coordinates
        is_valid, lat, lng = validate_coordinates(latitude, longitude)
        if not is_valid:
            return Response(
                {"error": "Invalid coordinates provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use real reverse geocoding service
        result = get_location_from_coordinates(lat, lng)
        return Response(result)


class LocationContextView(APIView):
    """Get comprehensive location context including nearby restaurants"""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        latitude = request.query_params.get("latitude")
        longitude = request.query_params.get("longitude")

        if not latitude or not longitude:
            return Response(
                {"error": "latitude and longitude parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate coordinates
        is_valid, lat, lng = validate_coordinates(latitude, longitude)
        if not is_valid:
            return Response(
                {"error": "Invalid coordinates provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get comprehensive location context
        context = get_user_location_context(lat, lng)
        return Response(context)


# Legacy views for backward compatibility
class FoodPlaceListCreateView(FoodItemListCreateView):
    """DEPRECATED: Use FoodItemListCreateView instead"""

    pass


class FoodPlaceDetailView(FoodItemDetailView):
    """DEPRECATED: Use FoodItemDetailView instead"""

    pass
