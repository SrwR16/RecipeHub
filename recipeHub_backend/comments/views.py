from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets

from . import models, serializers


@method_decorator(csrf_exempt, name="dispatch")
class CommentViewset(viewsets.ModelViewSet):
    queryset = models.Comment.objects.all()
    serializer_class = serializers.CommentSerializer


@method_decorator(csrf_exempt, name="dispatch")
class ReactViewset(viewsets.ModelViewSet):
    queryset = models.Reaction.objects.all()
    serializer_class = serializers.ReactionSerializers
