from django.db import models
from user.models import CustomUser

class Recipe(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, blank=True, null=True)
    
    title = models.CharField(max_length=150)
    ingredients = models.TextField()
    flavour = models.CharField(max_length=100)
    region = models.CharField(max_length=50)
    media = models.FileField(upload_to='uploads/kitchen/', blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    seasonal = models.CharField(max_length=150, null=True, blank=True)

    def __str__(self):
        return self.title



