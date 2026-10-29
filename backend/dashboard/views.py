from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.models import Product
from products.serializers import ProductSerializer


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = request.user.profile.organization

        products = Product.objects.filter(
            organization=organization
        )

        total_products = products.count()
        total_units = 0
        inventory_cost_value = Decimal("0.00")
        low_stock_products = []

        for product in products:
            total_units += product.quantity

            if product.cost_price is not None:
                inventory_cost_value += (
                    product.cost_price * product.quantity
                )

            threshold = (
                product.low_stock_threshold
                if product.low_stock_threshold is not None
                else organization.default_low_stock_threshold
            )

            if product.quantity <= threshold:
                low_stock_products.append(product)

        return Response({
            "total_products": total_products,
            "total_units": total_units,
            "inventory_cost_value": str(inventory_cost_value),
            "low_stock_count": len(low_stock_products),
            "low_stock_products": ProductSerializer(
                low_stock_products,
                many=True,
            ).data,
        })