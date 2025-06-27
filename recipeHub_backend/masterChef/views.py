from django.shortcuts import render
from rest_framework import viewsets, response, status
from . import serializers, models
from . import ai
# Create your views here.

class HumanTextViewset(viewsets.ModelViewSet):
    queryset = models.HumanText.objects.all()
    serializer_class = serializers.HumanTextSerializers

    def create(self, request, *args, **kwargs):
        
        # print the human text from got the front end
        # print(f"Data from front end: {request.data}")

        # call the serializers to save the data in database ======= 1st Approach
        # response = super().create(request, *args, **kwargs)
        # print('Response:', response) ## Response: <Response status_code=201, "text/html; charset=utf-8">

        # call the serializers to save the data in database ======= 2nd Approach
        
        # Ensure the request data is in the correct format
        if isinstance(request.data, dict):  # Ensure the data is a dictionary
            # Call the serializer to save the data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Save the instance (this calls the serializer's create method)
            instance = serializer.save()
            # print('2nd Approach Response:', instance) ## 2nd Approach Response: Hello, so now i can call the ai file with this data

            # Call ai.master_chef after saving the instance
            ai_response = ai.master_chef(instance)

            data = {
                "instance": serializer.data, # Serialized instance data (Extra sending)
                "ai_response": ai_response,   # AI response (What i need actually:3 )
            }
            return response.Response(data, status=status.HTTP_201_CREATED)
        else:
            return response.Response({"error":"Invalid data format"}, status=status.HTTP_400_BAD_REQUEST)

class SavingResponseViewset(viewsets.ModelViewSet):
    queryset = models.SavingResponse.objects.all()
    serializer_class = serializers.SavingResponseSerializer