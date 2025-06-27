from django.shortcuts import render
from rest_framework import viewsets
from . import models
from . import serializers
# Create your views here.

class PodcastEpisodeNormalViewset(viewsets.ModelViewSet):
    queryset = models.PodcastEpisodeNormal.objects.all()
    serializer_class = serializers.PodcastEpisodeNormalSerializers


class PodcastEpisodePremiumViewset(viewsets.ModelViewSet):
    queryset = models.PodcastEpisodePremium.objects.all()
    serializer_class = serializers.PodcastEpisodePremimumSerializers