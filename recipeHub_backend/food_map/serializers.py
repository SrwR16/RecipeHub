from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    FoodCategory,
    FoodItem,
    FoodItemImage,
    FoodItemReview,
    SearchHistory,
    UserFavoriteFoodItem,
)
from .utils import calculate_distance

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user information in reviews and favorites"""

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class FoodCategorySerializer(serializers.ModelSerializer):
    """Serializer for food categories"""

    food_items_count = serializers.SerializerMethodField()

    class Meta:
        model = FoodCategory
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "color",
            "food_items_count",
            "created_at",
            "updated_at",
        ]

    def get_food_items_count(self, obj):
        return obj.food_items.filter(is_active=True).count()


class FoodItemImageSerializer(serializers.ModelSerializer):
    """Serializer for food item images"""

    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = FoodItemImage
        fields = ["id", "image", "caption", "is_primary", "uploaded_by", "uploaded_at"]


class FoodItemReviewSerializer(serializers.ModelSerializer):
    """Serializer for food item reviews"""

    user = UserSerializer(read_only=True)

    class Meta:
        model = FoodItemReview
        fields = [
            "id",
            "user",
            "rating",
            "title",
            "comment",
            "purchase_date",
            "would_recommend",
            "value_for_money",
            "is_verified",
            "created_at",
            "updated_at",
        ]


class CreateFoodItemReviewSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews"""

    class Meta:
        model = FoodItemReview
        fields = [
            "rating",
            "title",
            "comment",
            "purchase_date",
            "would_recommend",
            "value_for_money",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        food_item = self.context["food_item"]
        validated_data["user"] = request.user
        validated_data["food_item"] = food_item
        return super().create(validated_data)


class FoodItemListSerializer(serializers.ModelSerializer):
    """Serializer for food items in list views (minimal data)"""

    category = FoodCategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    reviews_count = serializers.ReadOnlyField()
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = FoodItem
        fields = [
            "id",
            "name",
            "description",
            "food_type",
            "category",
            "price",
            "currency",
            "quantity_description",
            "restaurant_name",
            "address",
            "latitude",
            "longitude",
            "city",
            "country",
            "is_vegetarian",
            "is_vegan",
            "is_gluten_free",
            "is_halal",
            "availability_status",
            "primary_image",
            "distance",
            "is_favorite",
            "average_rating",
            "reviews_count",
            "created_by",
            "is_active",
            "created_at",
        ]

    def get_primary_image(self, obj):
        """Get the primary image URL"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(primary_image.image.url)
                if request
                else primary_image.image.url
            )
        return None

    def get_distance(self, obj):
        """Calculate distance from user's location if provided"""
        request = self.context.get("request")
        if request and hasattr(request, "user_location"):
            user_lat = float(request.user_location["latitude"])
            user_lng = float(request.user_location["longitude"])
            return calculate_distance(
                float(obj.latitude), float(obj.longitude), user_lat, user_lng
            )
        return None

    def get_is_favorite(self, obj):
        """Check if food item is in user's favorites"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return UserFavoriteFoodItem.objects.filter(
                user=request.user, food_item=obj
            ).exists()
        return False


class FoodItemDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed food item view"""

    category = FoodCategorySerializer(read_only=True)
    images = FoodItemImageSerializer(many=True, read_only=True)
    reviews = FoodItemReviewSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    distance = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    reviews_count = serializers.ReadOnlyField()
    user_review = serializers.SerializerMethodField()

    class Meta:
        model = FoodItem
        fields = [
            "id",
            "name",
            "description",
            "food_type",
            "category",
            "price",
            "currency",
            "quantity_description",
            "restaurant_name",
            "address",
            "latitude",
            "longitude",
            "city",
            "country",
            "ingredients",
            "preparation_time",
            "serving_size",
            "contact_phone",
            "contact_email",
            "pickup_instructions",
            "is_vegetarian",
            "is_vegan",
            "is_gluten_free",
            "is_halal",
            "contains_nuts",
            "availability_status",
            "available_from",
            "available_until",
            "is_active",
            "is_verified",
            "created_by",
            "images",
            "reviews",
            "distance",
            "is_favorite",
            "average_rating",
            "reviews_count",
            "user_review",
            "created_at",
            "updated_at",
        ]

    def get_distance(self, obj):
        """Calculate distance from user's location if provided"""
        request = self.context.get("request")
        if request and hasattr(request, "user_location"):
            user_lat = float(request.user_location["latitude"])
            user_lng = float(request.user_location["longitude"])
            return calculate_distance(
                float(obj.latitude), float(obj.longitude), user_lat, user_lng
            )
        return None

    def get_is_favorite(self, obj):
        """Check if food item is in user's favorites"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return UserFavoriteFoodItem.objects.filter(
                user=request.user, food_item=obj
            ).exists()
        return False

    def get_user_review(self, obj):
        """Get current user's review for this food item"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            review = obj.reviews.filter(user=request.user).first()
            if review:
                return FoodItemReviewSerializer(review).data
        return None


class CreateFoodItemSerializer(serializers.ModelSerializer):
    """Serializer for creating food items"""

    class Meta:
        model = FoodItem
        fields = [
            "name",
            "description",
            "food_type",
            "category",
            "price",
            "currency",
            "quantity_description",
            "address",
            "latitude",
            "longitude",
            "city",
            "country",
            "ingredients",
            "preparation_time",
            "serving_size",
            "contact_phone",
            "contact_email",
            "pickup_instructions",
            "is_vegetarian",
            "is_vegan",
            "is_gluten_free",
            "is_halal",
            "contains_nuts",
            "availability_status",
            "available_from",
            "available_until",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["created_by"] = request.user
        return super().create(validated_data)


class UserFavoriteFoodItemSerializer(serializers.ModelSerializer):
    """Serializer for user favorites"""

    food_item = FoodItemListSerializer(read_only=True)

    class Meta:
        model = UserFavoriteFoodItem
        fields = ["id", "food_item", "notes", "created_at"]


class CreateUserFavoriteFoodItemSerializer(serializers.ModelSerializer):
    """Serializer for creating favorites"""

    class Meta:
        model = UserFavoriteFoodItem
        fields = ["notes"]

    def create(self, validated_data):
        request = self.context["request"]
        food_item = self.context["food_item"]
        validated_data["user"] = request.user
        validated_data["food_item"] = food_item
        return super().create(validated_data)


class SearchHistorySerializer(serializers.ModelSerializer):
    """Serializer for search history"""

    class Meta:
        model = SearchHistory
        fields = [
            "id",
            "query",
            "location",
            "latitude",
            "longitude",
            "results_count",
            "created_at",
        ]


class NearbyFoodItemsSerializer(serializers.Serializer):
    """Serializer for nearby food items search parameters"""

    latitude = serializers.DecimalField(max_digits=10, decimal_places=8)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8)
    radius = serializers.IntegerField(
        default=2000, min_value=100, max_value=10000
    )  # Default 2km
    category = serializers.CharField(required=False)
    food_type = serializers.CharField(required=False)
    max_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )
    is_vegetarian = serializers.BooleanField(required=False)
    is_vegan = serializers.BooleanField(required=False)
    is_gluten_free = serializers.BooleanField(required=False)


class FoodItemSearchSerializer(serializers.Serializer):
    """Serializer for food item search parameters"""

    query = serializers.CharField(max_length=500)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False)
    longitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, required=False
    )
    radius = serializers.IntegerField(
        default=5000, min_value=100, max_value=10000, required=False
    )


# Legacy serializers for backward compatibility
class FoodPlaceListSerializer(FoodItemListSerializer):
    """DEPRECATED: Use FoodItemListSerializer instead"""

    pass


class FoodPlaceDetailSerializer(FoodItemDetailSerializer):
    """DEPRECATED: Use FoodItemDetailSerializer instead"""

    pass
