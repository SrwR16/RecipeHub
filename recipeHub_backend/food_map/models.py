import uuid

from django.contrib.auth import get_user_model
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

User = get_user_model()


class FoodCategory(models.Model):
    """Categories for food items (e.g., Pizza, Burgers, Desserts, etc.)"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # For frontend icons
    color = models.CharField(max_length=7, default="#FF6B6B")  # Hex color code
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Food Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class FoodItem(models.Model):
    """Model for user-added food items with location and pricing"""

    FOOD_TYPES = [
        ("homemade", "Homemade"),
        ("restaurant", "Restaurant Food"),
        ("street_food", "Street Food"),
        ("bakery", "Bakery Item"),
        ("dessert", "Dessert"),
        ("beverage", "Beverage"),
        ("snack", "Snack"),
        ("other", "Other"),
    ]

    AVAILABILITY_STATUS = [
        ("available", "Available"),
        ("sold_out", "Sold Out"),
        ("limited", "Limited Quantity"),
        ("pre_order", "Pre-order Only"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField()
    food_type = models.CharField(max_length=20, choices=FOOD_TYPES, default="homemade")
    category = models.ForeignKey(
        FoodCategory, on_delete=models.CASCADE, related_name="food_items"
    )

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    quantity_description = models.CharField(
        max_length=100, blank=True
    )  # e.g., "per slice", "per plate"

    # Location data
    restaurant_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Name of restaurant/establishment (if applicable)",
    )
    address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    city = models.CharField(max_length=100, default="")
    country = models.CharField(max_length=100, default="")

    # Additional details
    ingredients = models.TextField(blank=True, help_text="List main ingredients")
    preparation_time = models.CharField(
        max_length=50, blank=True
    )  # e.g., "Ready in 30 mins"
    serving_size = models.CharField(
        max_length=50, blank=True
    )  # e.g., "Serves 2-3 people"

    # Contact information
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    pickup_instructions = models.TextField(blank=True)

    # Dietary information
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_halal = models.BooleanField(default=False)
    contains_nuts = models.BooleanField(default=False)

    # Availability
    availability_status = models.CharField(
        max_length=20, choices=AVAILABILITY_STATUS, default="available"
    )
    available_from = models.DateTimeField(null=True, blank=True)
    available_until = models.DateTimeField(null=True, blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    # Metadata
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="food_items"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["latitude", "longitude"]),
            models.Index(fields=["city"]),
            models.Index(fields=["food_type"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["availability_status"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.price} {self.currency}"

    @property
    def average_rating(self):
        """Calculate average rating from user reviews"""
        reviews = self.reviews.filter(is_active=True)
        if reviews.exists():
            return reviews.aggregate(models.Avg("rating"))["rating__avg"]
        return None

    @property
    def reviews_count(self):
        """Count of active user reviews"""
        return self.reviews.filter(is_active=True).count()


class FoodItemImage(models.Model):
    """Images for food items"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    food_item = models.ForeignKey(
        FoodItem, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="food_items/images/")
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "-uploaded_at"]

    def __str__(self):
        return f"Image for {self.food_item.name}"


class FoodItemReview(models.Model):
    """User reviews for food items"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    food_item = models.ForeignKey(
        FoodItem, on_delete=models.CASCADE, related_name="reviews"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="food_item_reviews"
    )

    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)

    # Review details
    purchase_date = models.DateField(null=True, blank=True)
    would_recommend = models.BooleanField(null=True, blank=True)
    value_for_money = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["food_item", "user"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.food_item.name} ({self.rating}/5)"


class UserFavoriteFoodItem(models.Model):
    """User's favorite food items"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="favorite_food_items"
    )
    food_item = models.ForeignKey(
        FoodItem, on_delete=models.CASCADE, related_name="favorited_by"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "food_item"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.food_item.name}"


class SearchHistory(models.Model):
    """Track user search history for better recommendations"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="search_history",
        null=True,
        blank=True,
    )
    query = models.CharField(max_length=500)
    location = models.CharField(max_length=200, blank=True)
    latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    results_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["query"]),
        ]

    def __str__(self):
        user_info = f"{self.user.username}" if self.user else "Anonymous"
        return f"{user_info} searched '{self.query}'"


# Keep legacy models for backward compatibility but mark as deprecated
class FoodPlace(models.Model):
    """DEPRECATED: Legacy model for restaurant places - use FoodItem instead"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_places"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class FoodPlaceReview(models.Model):
    """DEPRECATED: Legacy model - use FoodItemReview instead"""

    pass


class UserFavoritePlace(models.Model):
    """DEPRECATED: Legacy model - use UserFavoriteFoodItem instead"""

    pass


class FoodPlaceMenuItem(models.Model):
    """DEPRECATED: Legacy model - food items are now top-level entities"""

    pass
