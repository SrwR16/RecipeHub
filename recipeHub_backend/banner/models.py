from django.db import models


class Banner(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField()
    image = models.ImageField(upload_to='uploads/banner/', blank=True, null=True)

    def __str__(self) -> str:
        return self.title
    
