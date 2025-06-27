from rest_framework import serializers
from . import models


class PodcastEpisodeNormalSerializers(serializers.ModelSerializer):
    name = serializers.CharField(source='podcast.name', read_only=True)
    image = serializers.CharField(source='podcast.image', read_only=True)
    keyword = serializers.CharField(source='podcast.keyword', read_only=True)
    description = serializers.CharField(source='podcast.description', read_only=True)
    class Meta:
        model = models.PodcastEpisodeNormal
        fields = '__all__'


class PodcastEpisodePremimumSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.PodcastEpisodePremium
        fields = '__all__'
        