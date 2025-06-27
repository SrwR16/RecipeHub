from rest_framework import serializers
from . import models


class BannnerSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.Banner
        fields = '__all__'

    