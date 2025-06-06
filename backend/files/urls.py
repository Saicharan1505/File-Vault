

from django.contrib import admin


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet, StorageStatsView

router = DefaultRouter()
router.register(r'files', FileViewSet, basename='file')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('files.urls')),
    path('', include(router.urls)),
    path('storage-stats/', StorageStatsView.as_view(), name='storage-stats'),
]

