from rest_framework import serializers
from . import models

class PromotionsSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.Promotions
        fields = '__all__'