from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Session(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        CANCELLED = 'cancelled', 'Cancelled'
        COMPLETED = 'completed', 'Completed'

    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sessions',
    )
    cover_image = models.URLField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_free = models.BooleanField(default=True)
    capacity = models.PositiveIntegerField(default=10)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    tags = models.CharField(max_length=500, blank=True)  # comma-separated
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_at']),
        ]

    def save(self, *args, **kwargs):
        # Keep is_free consistent with price.
        self.is_free = self.price is None or float(self.price) == 0.0
        super().save(*args, **kwargs)

    @property
    def confirmed_bookings_count(self):
        # Iterate the prefetched cache (when present) to avoid an extra
        # query per session in list views.
        return sum(1 for b in self.bookings.all() if b.status == 'confirmed')

    @property
    def available_spots(self):
        return max(self.capacity - self.confirmed_bookings_count, 0)

    @property
    def is_fully_booked(self):
        return self.available_spots <= 0

    def __str__(self):
        return self.title
