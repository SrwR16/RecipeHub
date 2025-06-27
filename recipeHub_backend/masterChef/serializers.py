from rest_framework import serializers
from . import models


class HumanTextSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.HumanText
        fields = "__all__"

    # def create(self, validated_data):
    #     # print data before saving

    #     # print(f"Data before Saving: {validated_data}")

    #     # save to database
    #     instance = super().create(validated_data)

    #     # Print the instance after saving
    #     # print(f"Print the instance after saving: {instance}")

    #     return instance

class SavingResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SavingResponse
        fields = "__all__"