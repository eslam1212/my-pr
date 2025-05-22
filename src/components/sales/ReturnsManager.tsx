import React, { useEffect, useState } from 'react';
import { returnService } from '../../services/returnService';
import { Return } from '../../services/types';

export const ReturnsManager: React.FC = () => {
  const [returns, setReturns] = useState<Return[]>([]);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const data = await returnService.getAll();
        setReturns(data);
      } catch (error) {
        console.error('Error fetching returns:', error);
      }
    };

    fetchReturns();
  }, []);

  return (
    <div>
      <h2>Returns</h2>
      <ul>
        {returns.map((returnData) => (
          <li key={returnData.id}>
            Return #{returnData.id} - Reason: {returnData.reason}
          </li>
        ))}
      </ul>
    </div>
  );
};
