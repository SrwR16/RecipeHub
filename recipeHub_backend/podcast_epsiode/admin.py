from django.contrib import admin
from .models import PodcastEpisodeNormal, PodcastEpisodePremium
# Register your models here.


admin.site.register(PodcastEpisodeNormal)
admin.site.register(PodcastEpisodePremium)