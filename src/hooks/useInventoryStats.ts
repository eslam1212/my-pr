import { useProducts } from './useProducts';

export function useInventoryStats() {
  const { products } = useProducts();

  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.quantity > 0).length;
  const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity).length;
  const alerts = lowStockProducts;

  return {
    totalProducts,
    inStockProducts,
    lowStockProducts,
    alerts
  };
}
