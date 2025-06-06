# backend/files/filters.py

import django_filters
from .models import File

class FileFilter(django_filters.FilterSet):
    # Filter by size range
    size_min = django_filters.NumberFilter(field_name='size', lookup_expr='gte')
    size_max = django_filters.NumberFilter(field_name='size', lookup_expr='lte')
    # Filter by upload date range
    uploaded_after = django_filters.DateFilter(field_name='uploaded_at', lookup_expr='gte')
    uploaded_before = django_filters.DateFilter(field_name='uploaded_at', lookup_expr='lte')

    class Meta:
        model = File
        fields = [
            'file_type',        # exact match on MIME or extension
            'size_min',         # logical filters on "size"
            'size_max',
            'uploaded_after',   # logical filters on "uploaded_at"
            'uploaded_before',
        ]
