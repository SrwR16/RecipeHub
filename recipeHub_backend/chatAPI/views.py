# generics.ListAPIView is a generic view that provides read-only access to a collection of model instances. It handles the GET method and returns a list of objects.
from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from django.db.models import Q
from .models import Profile, GroupMessage, ChatGroup
from .serializers import ProfileSerializer, GroupMessageSerializer, ChatGroupSerializers
from rest_framework.decorators import action


class SearchUser(generics.ListAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()

    def list(self, request, *args, **kwargs):
        username = self.kwargs['username']
        logged_in_user = self.request.user 

        users = Profile.objects.filter(
            Q(user__username__icontains=username) |
            Q(full_name__icontains=username) | 
            Q(user__email__icontains=username)
        )

        if not users.exists():
            return Response(
                {"detail": "No Users Found!"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

# not used till now
class ProfileViewset(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class ChatGroupViewset(viewsets.ModelViewSet):
    queryset = ChatGroup.objects.all()
    serializer_class = ChatGroupSerializers

class GroupMessageViewSet(viewsets.ModelViewSet):
    queryset = GroupMessage.objects.all()
    serializer_class = GroupMessageSerializer






