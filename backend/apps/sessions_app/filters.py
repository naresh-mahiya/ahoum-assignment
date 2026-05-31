from django.db.models import Count, F, Q
from django_filters import rest_framework as filters

from .models import Session


class SessionFilter(filters.FilterSet):
    search = filters.CharFilter(method='filter_search')
    category = filters.CharFilter(field_name='category__slug')
    is_free = filters.BooleanFilter()
    available_only = filters.BooleanFilter(method='filter_available')
    date_from = filters.DateTimeFilter(field_name='scheduled_at', lookup_expr='gte')
    date_to = filters.DateTimeFilter(field_name='scheduled_at', lookup_expr='lte')
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')

    class Meta:
        model = Session
        fields = ['category', 'is_free', 'status']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(tags__icontains=value)
            | Q(creator__first_name__icontains=value)
            | Q(creator__last_name__icontains=value)
        )

    def filter_available(self, queryset, name, value):
        if value:
            return queryset.annotate(
                booking_count=Count(
                    'bookings', filter=Q(bookings__status='confirmed')
                )
            ).filter(booking_count__lt=F('capacity'))
        return queryset
