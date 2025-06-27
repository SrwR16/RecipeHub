from django.shortcuts import render
from rest_framework import viewsets
from . import models, serializers



class CommentViewset(viewsets.ModelViewSet):
    queryset = models.Comment.objects.all()
    serializer_class = serializers.CommentSerializer

class ReactViewset(viewsets.ModelViewSet):
    queryset = models.Reaction.objects.all()
    serializer_class = serializers.ReactionSerializers

    