from django.shortcuts import render
from rest_framework import viewsets
from . import models
from . import serializers
# Create your views here.

class OrderViewset(viewsets.ModelViewSet):
    queryset = models.Order.objects.all()
    serializer_class = serializers.OrderSerializers

