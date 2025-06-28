from rest_framework import serializers
from . import models


class PopularitySerializers(serializers.ModelSerializer):
    class Meta:
        model = models.Popularity
        fields = '__all__'

