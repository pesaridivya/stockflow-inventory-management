from rest_framework import serializers
from products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "description",
            "quantity",
            "cost_price",
            "selling_price",
            "low_stock_threshold",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_sku(self, value):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            organization = request.user.profile.organization

            existing = Product.objects.filter(
                organization=organization,
                sku__iexact=value.strip(),
            )

            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                raise serializers.ValidationError(
                    "This SKU already exists in your organization."
                )

        return value.strip()