from django.shortcuts import render
from rest_framework import viewsets
from . import models
from . import serializers
# Create your views here.

class PodcastViewset(viewsets.ModelViewSet):
    queryset = models.Podcast.objects.all()
    serializer_class = serializers.PodcastSerializers


class PremiumPodcastViewset(viewsets.ModelViewSet):
    queryset = models.PremimumPodcast.objects.all()
    serializer_class = serializers.PremimumPodcastSerializers