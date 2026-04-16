/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';

const ShopContext = createContext(null);

const CART_KEY = 'mern_cart_items';
const USER_KEY = 'mern_user_info';

export const ShopProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [userInfo, setUserInfo] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (userInfo) {
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [userInfo]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);

      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, item.product.countInStock),
              }
            : item
        );
      }

      return [...prev, { product, quantity: Math.min(quantity, product.countInStock) }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product._id !== productId) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(1, Math.min(quantity, item.product.countInStock)),
        };
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const register = async (payload) => {
    const { data } = await apiClient.post('/auth/register', payload);
    setUserInfo(data);
    return data;
  };

  const login = async (payload) => {
    const { data } = await apiClient.post('/auth/login', payload);
    setUserInfo(data);
    return data;
  };

  const logout = () => {
    setUserInfo(null);
  };

  const createOrder = useCallback(async (payload) => {
    if (!userInfo?.token) {
      throw new Error('Please sign in to place an order.');
    }

    const { data } = await apiClient.post('/orders', payload, {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    });

    clearCart();
    return data;
  }, [userInfo]);

  const getAuthConfig = useCallback(() => {
    if (!userInfo?.token) {
      throw new Error('Please sign in first.');
    }

    return {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
  }, [userInfo]);

  const fetchMyOrders = useCallback(async () => {
    const { data } = await apiClient.get('/orders/my-orders', getAuthConfig());

    return data;
  }, [getAuthConfig]);

  const createProduct = useCallback(async (payload) => {
    const { data } = await apiClient.post('/products', payload, getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const updateProduct = useCallback(async (productId, payload) => {
    const { data } = await apiClient.put(`/products/${productId}`, payload, getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const deleteProduct = useCallback(async (productId) => {
    const { data } = await apiClient.delete(`/products/${productId}`, getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const fetchProfileSummary = useCallback(async () => {
    const { data } = await apiClient.get('/auth/profile-summary', getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const validateCoupon = useCallback(async (payload) => {
    const { data } = await apiClient.post('/coupons/validate', payload, getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const fetchCoupons = useCallback(async () => {
    const { data } = await apiClient.get('/coupons', getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const createCoupon = useCallback(async (payload) => {
    const { data } = await apiClient.post('/coupons', payload, getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const deleteCoupon = useCallback(async (couponId) => {
    const { data } = await apiClient.delete(`/coupons/${couponId}`, getAuthConfig());
    return data;
  }, [getAuthConfig]);

  const cartSummary = useMemo(() => {
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return {
      itemsCount,
      subtotal,
    };
  }, [cartItems]);

  const value = {
    cartItems,
    userInfo,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    register,
    login,
    logout,
    createOrder,
    fetchMyOrders,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProfileSummary,
    validateCoupon,
    fetchCoupons,
    createCoupon,
    deleteCoupon,
    cartSummary,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error('useShop must be used inside ShopProvider');
  }

  return context;
};
