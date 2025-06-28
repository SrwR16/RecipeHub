# generics.ListAPIView is a generic view that provides read-only access to a collection of model instances. It handles the GET method and returns a list of objects.
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status, viewsets
from rest_framework.response import Response

from .models import ChatGroup, GroupMessage, Profile
from .serializers import ChatGroupSerializers, GroupMessageSerializer, ProfileSerializer


class SearchUser(generics.ListAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()

    def list(self, request, *args, **kwargs):
        username = self.kwargs["username"]
        logged_in_user = self.request.user

        users = Profile.objects.filter(
            Q(user__username__icontains=username)
            | Q(full_name__icontains=username)
            | Q(user__email__icontains=username)
        )

        if not users.exists():
            return Response(
                {"detail": "No Users Found!"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name="dispatch")
class ProfileViewset(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


@method_decorator(csrf_exempt, name="dispatch")
class ChatGroupViewset(viewsets.ModelViewSet):
    queryset = ChatGroup.objects.all()
    serializer_class = ChatGroupSerializers


@method_decorator(csrf_exempt, name="dispatch")
class GroupMessageViewSet(viewsets.ModelViewSet):
    queryset = GroupMessage.objects.all()
    serializer_class = GroupMessageSerializer
