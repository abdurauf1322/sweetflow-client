import { useState, useCallback } from 'react';
import api from '../services/api';

export const useStores = () => {
  const [stores, setStores] = useState([]);
  const [overdueStores, setOverdueStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/stores');
      setStores(response.data.data.stores);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverdueStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/stores/overdue');
      setOverdueStores(response.data.data.stores);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch overdue stores');
    } finally {
      setLoading(false);
    }
  }, []);

  const addStore = async (storeData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/stores', storeData);
      setStores((prev) => [response.data.data.store, ...prev]);
      return { success: true, store: response.data.data.store };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register store');
      return { success: false, error: err.response?.data?.message || 'Failed to register store' };
    } finally {
      setLoading(false);
    }
  };

  const getStoreOrders = async (storeId) => {
    try {
      const response = await api.get(`/stores/${storeId}/orders`);
      return response.data.data.orders;
    } catch (err) {
      return [];
    }
  };

  const deleteStore = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/stores/${id}`);
      setStores((prev) => prev.filter((s) => s.id !== id));
      setOverdueStores((prev) => prev.filter((s) => s.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete store');
      return { success: false, error: err.response?.data?.message || 'Failed to delete store' };
    } finally {
      setLoading(false);
    }
  };

  const updateStore = async (id, storeData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/stores/${id}`, storeData);
      const updatedStore = response.data.data.store;

      // Immediately update local state with enriched store (includes lastOrderDueDate)
      setStores((prev) => prev.map((s) => (s.id === id ? updatedStore : s)));
      setOverdueStores((prev) => prev.map((s) => (s.id === id ? updatedStore : s)));

      // Then do a full refetch to guarantee everything is in sync
      try {
        const fresh = await api.get('/stores');
        setStores(fresh.data.data.stores);
      } catch (_) {
        // silently ignore — local patch above is enough as fallback
      }

      return { success: true, store: updatedStore };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store');
      return { success: false, error: err.response?.data?.message || 'Failed to update store' };
    } finally {
      setLoading(false);
    }
  };

  const addStorePayment = async (storeId, paymentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/stores/${storeId}/payments`, paymentData);
      const updatedPayment = response.data.data.payment;
      
      // Update local store balance immediately
      setStores((prev) => prev.map((s) => {
        if (s.id === storeId) {
          return { ...s, currentDebt: Number(s.currentDebt) - Number(paymentData.amount) };
        }
        return s;
      }));
      setOverdueStores((prev) => prev.map((s) => {
        if (s.id === storeId) {
          return { ...s, currentDebt: Number(s.currentDebt) - Number(paymentData.amount) };
        }
        return s;
      }).filter(s => Number(s.currentDebt) > 0));

      return { success: true, payment: updatedPayment };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment');
      return { success: false, error: err.response?.data?.message || 'Failed to submit payment' };
    } finally {
      setLoading(false);
    }
  };

  const getStorePayments = async (storeId) => {
    try {
      const response = await api.get(`/stores/${storeId}/payments`);
      return response.data.data.payments;
    } catch (err) {
      return [];
    }
  };

  const sendStoreReminder = async (storeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/stores/${storeId}/send-reminder`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reminder');
      return { success: false, error: err.response?.data?.message || 'Failed to send reminder' };
    } finally {
      setLoading(false);
    }
  };

  return {
    stores,
    overdueStores,
    loading,
    error,
    fetchStores,
    fetchOverdueStores,
    addStore,
    getStoreOrders,
    deleteStore,
    updateStore,
    addStorePayment,
    getStorePayments,
    sendStoreReminder,
  };
};
