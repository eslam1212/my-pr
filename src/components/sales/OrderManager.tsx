import React, { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { Order } from '../../services/types';

export const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getAll();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      <h2>Orders</h2>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            Order #{order.id} - Total: ${order.total}
          </li>
        ))}
      </ul>
    </div>
  );
};
