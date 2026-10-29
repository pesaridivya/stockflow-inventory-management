from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from products.models import Product
from products.serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.filter(
            organization=self.request.user.profile.organization
        ).order_by("-created_at")

        search = self.request.query_params.get("search", "").strip()

        if search:
            from django.db.models import Q

            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.profile.organization
        )