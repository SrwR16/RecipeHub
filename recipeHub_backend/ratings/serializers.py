from rest_framework import serializers
from . import models

class RatingSerializers(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    title = serializers.CharField(source='promotions.title', read_only=True)
    description = serializers.CharField(read_only=True)
    image = serializers.CharField(source='promotions.image', read_only=True)
    product_count = serializers.CharField(read_only=True)

    class Meta:
        model = models.Rating
        fields = '__all__'