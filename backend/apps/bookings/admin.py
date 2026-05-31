from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'session', 'status', 'payment_status', 'booked_at',
    )
    list_filter = ('status', 'payment_status')
    search_fields = ('user__email', 'session__title')
    autocomplete_fields = ('user', 'session')
