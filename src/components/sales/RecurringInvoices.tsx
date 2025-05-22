import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services/invoice.service';
import { RecurringInvoice } from '../../services/types';

export const RecurringInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<RecurringInvoice[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await invoiceService.getRecurringInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching recurring invoices:', error);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div>
      <h2>Recurring Invoices</h2>
      <ul>
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            Invoice #{invoice.id} - Amount: ${invoice.amount} (Frequency: {invoice.frequency})
          </li>
        ))}
      </ul>
    </div>
  );
};
