from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=255)
    default_low_stock_threshold = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name