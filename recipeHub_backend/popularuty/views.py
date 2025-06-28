from django.shortcuts import render
from rest_framework import viewsets
from . import models
from . import serializers
# Create your views here.

class PopularityViewset(viewsets.ModelViewSet):
    queryset = models.Popularity.objects.all()
    serializer_class = serializers.PopularitySerializers

