from django.db import models
from comments.models import Reaction

class Popularity(models.Model):
    react_count = models.ForeignKey(Reaction, on_delete=models.CASCADE)

    def __str__(self):
        return self.react_count
    