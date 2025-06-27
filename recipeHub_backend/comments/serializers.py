from rest_framework import serializers
from .models import Comment, Reaction


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Comment
        fields = '__all__'

class ReactionSerializers(serializers.ModelSerializer):  
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Reaction
        fields = '__all__'