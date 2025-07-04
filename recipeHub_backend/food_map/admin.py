from django.contrib import admin

from .models import (
    FoodCategory,
    FoodItem,
    FoodItemImage,
    FoodItemReview,
    SearchHistory,
    UserFavoriteFoodItem,
)


@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "description", "color", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["name", "description"]
    ordering = ["name"]


class FoodItemImageInline(admin.TabularInline):
    model = FoodItemImage
    extra = 0
    fields = ["image", "caption", "is_primary"]


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "food_type",
        "category",
        "price",
        "currency",
        "restaurant_name",
        "city",
        "availability_status",
        "is_active",
        "created_at",
    ]
    list_filter = [
        "food_type",
        "category",
        "availability_status",
        "is_active",
        "is_verified",
        "is_vegetarian",
        "is_vegan",
        "is_gluten_free",
        "is_halal",
        "created_at",
        "city",
        "country",
    ]
    search_fields = [
        "name",
        "description",
        "restaurant_name",
        "address",
        "city",
        "ingredients",
    ]
    readonly_fields = ["created_at", "updated_at", "average_rating", "reviews_count"]
    inlines = [FoodItemImageInline]

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("name", "description", "food_type", "category")},
        ),
        (
            "Pricing",
            {"fields": ("price", "currency", "quantity_description")},
        ),
        (
            "Location & Restaurant",
            {
                "fields": (
                    "restaurant_name",
                    "address",
                    "latitude",
                    "longitude",
                    "city",
                    "country",
                )
            },
        ),
        (
            "Food Details",
            {
                "fields": ("ingredients", "preparation_time", "serving_size"),
                "classes": ("collapse",),
            },
        ),
        (
            "Contact Information",
            {
                "fields": ("contact_phone", "contact_email", "pickup_instructions"),
                "classes": ("collapse",),
            },
        ),
        (
            "Dietary Information",
            {
                "fields": (
                    "is_vegetarian",
                    "is_vegan",
                    "is_gluten_free",
                    "is_halal",
                    "contains_nuts",
                ),
            },
        ),
        (
            "Availability",
            {
                "fields": ("availability_status", "available_from", "available_until"),
                "classes": ("collapse",),
            },
        ),
        ("Status", {"fields": ("is_active", "is_verified", "created_by")}),
        (
            "Metadata",
            {
                "fields": (
                    "average_rating",
                    "reviews_count",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(FoodItemImage)
class FoodItemImageAdmin(admin.ModelAdmin):
    list_display = ["food_item", "caption", "is_primary", "uploaded_by", "uploaded_at"]
    list_filter = ["is_primary", "uploaded_at"]
    search_fields = ["food_item__name", "caption"]
    readonly_fields = ["uploaded_at"]


@admin.register(FoodItemReview)
class FoodItemReviewAdmin(admin.ModelAdmin):
    list_display = [
        "food_item",
        "user",
        "rating",
        "title",
        "would_recommend",
        "is_active",
        "is_verified",
        "created_at",
    ]
    list_filter = [
        "rating",
        "would_recommend",
        "is_active",
        "is_verified",
        "created_at",
        "purchase_date",
        "value_for_money",
    ]
    search_fields = ["food_item__name", "user__username", "title", "comment"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (
            "Review Information",
            {"fields": ("food_item", "user", "rating", "title", "comment")},
        ),
        (
            "Details",
            {"fields": ("purchase_date", "would_recommend", "value_for_money")},
        ),
        ("Status", {"fields": ("is_active", "is_verified")}),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(UserFavoriteFoodItem)
class UserFavoriteFoodItemAdmin(admin.ModelAdmin):
    list_display = ["user", "food_item", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__username", "food_item__name"]
    readonly_fields = ["created_at"]


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ["user", "query", "location", "results_count", "created_at"]
    list_filter = ["created_at", "results_count"]
    search_fields = ["user__username", "query", "location"]
    readonly_fields = ["created_at"]

    fieldsets = (
        (
            "Search Information",
            {"fields": ("user", "query", "location", "latitude", "longitude")},
        ),
        ("Results", {"fields": ("results_count",)}),
        (
            "Metadata",
            {"fields": ("created_at",), "classes": ("collapse",)},
        ),
    )
