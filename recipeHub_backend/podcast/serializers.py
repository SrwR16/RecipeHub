from rest_framework import serializers
from . import models


class PodcastSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.Podcast
        fields = '__all__'


class PremimumPodcastSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.PremimumPodcast
        fields = '__all__'