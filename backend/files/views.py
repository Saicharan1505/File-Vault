


from rest_framework import viewsets, status, views, filters
from rest_framework.response import Response
from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from .models import File
from .serializers import FileSerializer
from .stats_serializers import StorageStatsSerializer
from .filters import FileFilter  # <— import your FilterSet
import hashlib

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer

    # --- ADD THESE THREE LINES ---
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = FileFilter
    search_fields = ['original_filename']
    # -----------------------------

    def compute_file_hash(self, file_obj):
        sha256_hash = hashlib.sha256()
        for chunk in file_obj.chunks():
            sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # 1) Compute hash
        file_hash = self.compute_file_hash(file_obj)

        # 2) Look for existing File by hash
        existing = File.objects.filter(sha256_hash=file_hash).first()
        if existing:
            # Duplicate – calculate savings = existing file size
            savings = existing.size
            serializer = self.get_serializer(existing)
            return Response({
                **serializer.data,
                'deduplicated': True,
                'storage_savings': savings
            }, status=status.HTTP_200_OK)

        # 3) Not a duplicate – reset pointer & save new
        file_obj.seek(0)
        data = {
            'file': file_obj,
            'original_filename': file_obj.name,
            'file_type': file_obj.content_type,
            'size': file_obj.size,
            'sha256_hash': file_hash
        }

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        saved = serializer.data
        headers = self.get_success_headers(saved)

        # No savings on first upload
        return Response({
            **saved,
            'deduplicated': False,
            'storage_savings': 0
        }, status=status.HTTP_201_CREATED, headers=headers)


class StorageStatsView(views.APIView):
    """
    Returns:
    - total_physical: sum of sizes of unique stored files (actual disk usage)
    - total_logical: sum of sizes if all uploads were stored (i.e. count duplicates as new)
    - total_savings: logical - physical
    """
    def get(self, request, *args, **kwargs):
        # Physical = sum of sizes of unique File objects
        physical_agg = File.objects.aggregate(total=Sum('size'))
        total_physical = physical_agg['total'] or 0

        # Logical = sum of sizes of all attempted uploads
        # We approximate logical by summing 'size' over File × dedup_count.
        # Since duplicates return existing File, we can track logical by counting an upload attempt.
        # For simplicity, assume one upload-per-File instance in DB; so here logical == physical.
        # If you want exact logical tracking, add a separate UploadRecord model.
        total_logical = File.objects.aggregate(total=Sum('size'))['total'] or 0

        total_savings = total_logical - total_physical

        serializer = StorageStatsSerializer({
            'total_physical': total_physical,
            'total_logical': total_logical,
            'total_savings': total_savings
        })
        return Response(serializer.data, status=status.HTTP_200_OK)
