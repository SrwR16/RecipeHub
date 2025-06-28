from django.db import models
from user.models import CustomUser
# Create your models here.


class Contact(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=11)
    email = models.EmailField()
    message = models.TextField()

    def __str__(self) -> str:
        return f'Name:{self.name}, Email:{self.email}, Message:{self.message}'
    
from django.db import connection
print(connection.queries)