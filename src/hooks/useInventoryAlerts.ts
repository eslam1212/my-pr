import { useProducts } from './useProducts';

export function useInventoryAlerts() {
  const { products } = useProducts();

  const alerts = products
    .filter(product => product.quantity <= product.minQuantity)
    .map(product => ({
      productId: product.id,
      message: `المنتج "${product.name}" وصل للحد الأدنى (${product.quantity} قطعة متبقية)`
    }));

  return alerts;
}
