import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { cartApi } from '../api';
import { useAuth } from './AuthContext';
import CartModal from '../components/common/CartModal';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // Helper to determine strictly user-scoped localStorage key
  const getCartKey = (u) => (u && u.id ? `medq_cart_user_${u.id}` : 'medq_cart_guest');

  // Purge any legacy shared cart keys to avoid cross-user contamination
  try {
    localStorage.removeItem('medq_cart_items');
  } catch (e) {
    // ignore
  }

  // Initialize from the active user's scoped localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const initialKey = user && user.id ? `medq_cart_user_${user.id}` : 'medq_cart_guest';
      const saved = localStorage.getItem(initialKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modal state for confirmations, limit warnings, and stock errors
  const [modal, setModal] = useState({ isOpen: false });

  // Keep a ref to the current active key to prevent writing to wrong key during switches
  const currentKeyRef = useRef(getCartKey(user));

  const closeModal = () => {
    setModal({ isOpen: false });
  };

  const fetchCart = async (targetUser = user) => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      const list = Array.isArray(data) ? data : (data?.items || []);
      setCartItems(list);
      const key = getCartKey(targetUser);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (error) {
      console.warn('Backend cart sync note:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Switch cart state immediately whenever user changes (login, logout, switch account)
  useEffect(() => {
    const key = getCartKey(user);
    currentKeyRef.current = key;

    try {
      const saved = localStorage.getItem(key);
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch {
      setCartItems([]);
    }

    fetchCart(user);
  }, [user?.id, isAuthenticated]);

  // Persist current cartItems to the active user's key only
  useEffect(() => {
    try {
      const key = currentKeyRef.current;
      localStorage.setItem(key, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart to localStorage:', e);
    }
  }, [cartItems]);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  /**
   * Adds product to cart with strict stock checks and maximum limit of 5 units.
   * Displays confirmation modal upon success, or alert modal on stock/limit violations.
   */
  const addToCart = async (product, quantity = 1) => {
    const pId = product.id || product.productId;
    const pPrice = parseFloat(product.effective_price || product.price || 0);
    const pName = product.name || product.productName || 'Medical Equipment';
    const pImage = product.imageUrl || product.image_url || product.image || '/images/medq2.jpg';
    const stock = product.stock_quantity ?? product.quantity ?? product.stock ?? 0;

    // 1. Stock check: Is the product empty / out of stock?
    if (stock <= 0) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Product Out of Stock',
        message: `"${pName}" is currently out of stock. You cannot add out-of-stock equipment to your cart.`
      });
      return false;
    }

    // 2. Existing quantity check
    const existing = cartItems.find(
      (it) => (it.productId || it.product?.id || it.id) === pId
    );
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + quantity;

    // 3. Maximum limit check (limit = 5 units)
    if (newQty > 5) {
      setModal({
        isOpen: true,
        type: 'limit',
        title: 'Order Limit Reached (Max 5 Units)',
        message: currentQty >= 5
          ? `You have reached the maximum allowed limit of 5 units of "${pName}" in your cart.`
          : `Adding ${quantity} item(s) exceeds the maximum limit of 5 units per customer. You currently have ${currentQty} in your cart.`
      });
      return false;
    }

    // 4. Available stock quantity check
    if (newQty > stock) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Insufficient Inventory',
        message: currentQty > 0
          ? `Only ${stock} unit(s) of "${pName}" are available in stock. You already have ${currentQty} in your cart.`
          : `Cannot add ${quantity} units. Only ${stock} unit(s) are currently available in stock.`
      });
      return false;
    }

    // 5. Update local cart state
    let updatedItems = [];
    if (existing) {
      updatedItems = cartItems.map((it) =>
        (it.productId || it.product?.id || it.id) === pId
          ? { ...it, quantity: newQty, stock_quantity: stock }
          : it
      );
    } else {
      updatedItems = [
        ...cartItems,
        {
          id: pId,
          productId: pId,
          productName: pName,
          name: pName,
          price: pPrice,
          quantity: quantity,
          imageUrl: pImage,
          stock_quantity: stock,
          product: { id: pId, name: pName, price: pPrice, image_url: pImage, stock_quantity: stock }
        }
      ];
    }
    setCartItems(updatedItems);

    // Compute updated totals for the modal confirmation
    const newSubtotal = updatedItems.reduce(
      (acc, item) => acc + (item.quantity || 0) * (parseFloat(item.price || item.product?.price || 0)),
      0
    );
    const newCount = updatedItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

    // 6. Show clean confirmation modal
    setModal({
      isOpen: true,
      type: 'success',
      title: 'Item Added to Cart',
      product: { ...product, name: pName, price: pPrice, image: pImage },
      quantityAdded: quantity,
      cartTotal: newSubtotal,
      itemCount: newCount
    });

    // 7. Sync with backend API
    try {
      await cartApi.addItem(pId, quantity);
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.detail;
      if (errMsg) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Cart Notice',
          message: errMsg
        });
      }
    }
    return true;
  };

  /**
   * Updates item quantity, enforcing max limit of 5 and current stock availability.
   */
  const updateQuantity = async (productId, newQuantity, availableStock) => {
    if (newQuantity < 1) return;

    // Limit check: max 5 units
    if (newQuantity > 5) {
      setModal({
        isOpen: true,
        type: 'limit',
        title: 'Order Limit Reached',
        message: 'Maximum order limit is 5 units per equipment item.'
      });
      return;
    }

    // Stock check
    if (availableStock !== undefined && newQuantity > availableStock) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Insufficient Inventory',
        message: `Only ${availableStock} unit(s) are available in stock for this equipment.`
      });
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        const id = item.productId || item.product?.id || item.id;
        return id === productId ? { ...item, quantity: newQuantity } : item;
      })
    );

    try {
      await cartApi.updateQuantity(productId, newQuantity);
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.detail;
      if (errMsg) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Stock Alert',
          message: errMsg
        });
      }
    }
  };

  /**
   * Prompts user with confirmation modal before removing item from cart
   */
  const confirmRemoveFromCart = (productId, productName = 'this item') => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Remove from Cart',
      message: `Are you sure you want to remove "${productName}" from your shopping cart?`,
      confirmText: 'Remove Item',
      cancelText: 'Keep in Cart',
      onConfirm: async () => {
        setCartItems((prev) =>
          prev.filter((item) => {
            const id = item.productId || item.product?.id || item.id;
            return id !== productId;
          })
        );
        notify('Item removed from cart', 'info');
        try {
          await cartApi.removeItem(productId);
        } catch (error) {
          console.warn('Remove item sync note:', error.message);
        }
      }
    });
  };

  const removeFromCart = async (productId) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        const id = item.productId || item.product?.id || item.id;
        return id !== productId;
      })
    );
    notify('Item removed from cart', 'info');
    try {
      await cartApi.removeItem(productId);
    } catch (error) {
      console.warn('Remove item sync note:', error.message);
    }
  };

  /**
   * Prompts user with confirmation modal before clearing entire cart
   */
  const confirmClearCart = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Clear Shopping Cart',
      message: 'Are you sure you want to remove all items from your cart? This action cannot be undone.',
      confirmText: 'Clear Entire Cart',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const key = currentKeyRef.current;
          localStorage.removeItem(key);
          localStorage.removeItem('medq_cart_items');
          setCartItems([]);
          await cartApi.clearCart();
        } catch (error) {
          console.warn('Error clearing cart:', error.message);
        }
      }
    });
  };

  const clearCart = async () => {
    try {
      const key = currentKeyRef.current;
      localStorage.removeItem(key);
      localStorage.removeItem('medq_cart_items');
      setCartItems([]);
      await cartApi.clearCart();
    } catch (error) {
      console.warn('Error clearing cart:', error.message);
    }
  };

  const itemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.quantity || 0) * (parseFloat(item.price || item.product?.price || 0)),
    0
  );

  const value = {
    cartItems,
    itemCount,
    subtotal: subtotal.toFixed(2),
    loading,
    notification,
    addToCart,
    updateQuantity,
    removeFromCart,
    confirmRemoveFromCart,
    clearCart,
    confirmClearCart,
    refreshCart: () => fetchCart(user),
    openModal: setModal,
    closeModal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Global Cart Action / Confirmation Modal */}
      <CartModal modal={modal} onClose={closeModal} />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
