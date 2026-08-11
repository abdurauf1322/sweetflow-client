import { useState } from 'react';
import api from '../services/api';

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/orders', orderData);
      return { success: true, order: response.data.data.order };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit order';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    loading,
    error,
  };
};
