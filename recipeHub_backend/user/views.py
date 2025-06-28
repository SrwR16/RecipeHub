from rest_framework import viewsets
from . import models, serializers


class UserViewset(viewsets.ModelViewSet):
    queryset = models.CustomUser.objects.all()
    serializer_class = serializers.UserSerializers