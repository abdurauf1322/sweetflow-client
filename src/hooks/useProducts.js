import { useState, useCallback } from 'react';
import api from '../services/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products');
      setProducts(response.data.data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products/low-stock');
      setLowStockProducts(response.data.data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch low stock products');
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const isFormData = productData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const response = await api.post('/products', productData, config);
      setProducts((prev) => [response.data.data.product, ...prev]);
      return { success: true, product: response.data.data.product };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
      return { success: false, error: err.response?.data?.message || 'Failed to add product' };
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setLowStockProducts((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
      return { success: false, error: err.response?.data?.message || 'Failed to delete product' };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    setLoading(true);
    setError(null);
    try {
      const isFormData = productData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const response = await api.put(`/products/${id}`, productData, config);
      const updatedProduct = response.data.data.product;
      setProducts((prev) => prev.map((p) => (p.id === id ? updatedProduct : p)));
      setLowStockProducts((prev) => {
        const isLowStock = updatedProduct.stockCount <= updatedProduct.minStockLimit;
        const exists = prev.some(p => p.id === id);
        
        if (isLowStock) {
          return exists ? prev.map(p => (p.id === id ? updatedProduct : p)) : [...prev, updatedProduct];
        } else {
          return prev.filter(p => p.id !== id);
        }
      });
      return { success: true, product: updatedProduct };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
      return { success: false, error: err.response?.data?.message || 'Failed to update product' };
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    lowStockProducts,
    loading,
    error,
    fetchProducts,
    fetchLowStock,
    addProduct,
    deleteProduct,
    updateProduct,
  };
};
