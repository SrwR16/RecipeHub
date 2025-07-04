from django.urls import path

from . import views

app_name = "food_map"

urlpatterns = [
    # API configuration
    path("api-key/", views.get_google_maps_api_key, name="api_key"),
    # Categories
    path("categories/", views.FoodCategoryListView.as_view(), name="category_list"),
    # Food Items
    path(
        "food-items/",
        views.FoodItemListCreateView.as_view(),
        name="food_item_list_create",
    ),
    path(
        "food-items/<uuid:pk>/",
        views.FoodItemDetailView.as_view(),
        name="food_item_detail",
    ),
    # Food Item Search & Discovery
    path(
        "food-items/nearby/",
        views.NearbyFoodItemsView.as_view(),
        name="nearby_food_items",
    ),
    path(
        "food-items/search/",
        views.FoodItemSearchView.as_view(),
        name="search_food_items",
    ),
    # Reviews
    path(
        "food-items/<uuid:food_item_id>/reviews/",
        views.FoodItemReviewListCreateView.as_view(),
        name="food_item_reviews",
    ),
    # Favorites
    path(
        "favorites/",
        views.UserFavoriteFoodItemsListView.as_view(),
        name="user_favorites",
    ),
    path(
        "food-items/<uuid:food_item_id>/favorite/",
        views.ToggleFavoriteFoodItemView.as_view(),
        name="toggle_favorite",
    ),
    # User data
    path(
        "search-history/", views.SearchHistoryListView.as_view(), name="search_history"
    ),
    # Utility endpoints
    path("geocode/", views.GeocodeAddressView.as_view(), name="geocode_address"),
    path(
        "reverse-geocode/", views.ReverseGeocodeView.as_view(), name="reverse_geocode"
    ),
    # Enhanced Location Services
    path(
        "location-context/",
        views.LocationContextView.as_view(),
        name="location_context",
    ),
    # Legacy endpoints for backward compatibility
    path(
        "places/", views.FoodPlaceListCreateView.as_view(), name="place_list"
    ),  # DEPRECATED
    path(
        "places/<uuid:pk>/", views.FoodPlaceDetailView.as_view(), name="place_detail"
    ),  # DEPRECATED
]
