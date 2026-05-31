from django.contrib import admin

from .models import Category, Session


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'creator', 'category', 'status', 'price',
        'capacity', 'scheduled_at',
    )
    list_filter = ('status', 'is_free', 'category')
    search_fields = ('title', 'description', 'tags', 'creator__email')
    autocomplete_fields = ('creator',)
    date_hierarchy = 'scheduled_at'
