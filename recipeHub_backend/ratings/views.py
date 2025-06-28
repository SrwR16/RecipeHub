from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets

from . import models, serializers

# Create your views here.


@method_decorator(csrf_exempt, name="dispatch")
class RatingViewset(viewsets.ModelViewSet):
    queryset = models.Rating.objects.all()
    serializer_class = serializers.RatingSerializers
