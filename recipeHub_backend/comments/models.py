from django.db import models
from user.models import CustomUser
from kitchen.models import Recipe

class Reaction(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE,blank=True, null= True)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE,blank=True, null= True)
    react = models.BooleanField(default=False,blank=True, null= True)

    def __str__(self):
        return f'{self.user} Reacted On Your {self.recipe} Recipe Post'


class Comment(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, blank=True, null= True)
    comment_text = models.TextField(blank=True, null= True)
    image = models.ImageField(upload_to='uploads/comment/', blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True, blank=True, null= True)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, blank=True, null=True)
    
    def __str__(self):
        return f'{self.user} : comment {self.comment_text}'

