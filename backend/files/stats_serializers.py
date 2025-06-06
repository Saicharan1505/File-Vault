# backend/files/stats_serializers.py

from rest_framework import serializers

class StorageStatsSerializer(serializers.Serializer):
    total_physical = serializers.IntegerField()
    total_logical = serializers.IntegerField()
    total_savings = serializers.IntegerField()
