from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets

from . import models, serializers

# Create your views here.


@method_decorator(csrf_exempt, name="dispatch")
class PodcastEpisodeNormalViewset(viewsets.ModelViewSet):
    queryset = models.PodcastEpisodeNormal.objects.all()
    serializer_class = serializers.PodcastEpisodeNormalSerializers


@method_decorator(csrf_exempt, name="dispatch")
class PodcastEpisodePremiumViewset(viewsets.ModelViewSet):
    queryset = models.PodcastEpisodePremium.objects.all()
    serializer_class = serializers.PodcastEpisodePremimumSerializers
