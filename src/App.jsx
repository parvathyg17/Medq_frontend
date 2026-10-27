import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute, AdminRoute } from './components/routing/ProtectedRoute';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Customer & Public Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import TrackOrderPage from './pages/TrackOrderPage';
import WishlistPage from './pages/WishlistPage';
import ChatAssistantPage from './pages/ChatAssistantPage';
import HelpContactPage from './pages/HelpContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';
import AddressesPage from './pages/AddressesPage';
import ProfilePage from './pages/ProfilePage';

// Admin Portal Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';
import AdminStockPage from './pages/admin/AdminStockPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Storefront Wrapper Layout
const StorefrontLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--slate-50)' }}>
      <Navbar />
      <main style={{ flex: '1 0 auto' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// 404 Not Found Page
const NotFoundPage = () => {
  return (
    <div className="container text-center" style={{ padding: '6rem 1rem' }}>
      <div style={{ fontSize: '5rem', fontWeight: '800', color: 'var(--primary-600)', fontFamily: 'var(--font-heading)' }}>
        404
      </div>
      <h2 className="font-heading mb-3">Medical Equipment / Page Not Found</h2>
      <p className="text-secondary mb-4" style={{ maxWidth: '500px', margin: '0 auto 1.5rem' }}>
        The clinical catalog or portal page you requested may have moved or been decommissioned.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
        <Link to="/equipments" className="btn btn-secondary">
          Explore Equipment
        </Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public and Customer Portal (Storefront Layout) */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/equipments" element={<CatalogPage />} />
              <Route path="/products" element={<CatalogPage />} />
              <Route path="/category/:category" element={<CatalogPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/confirm" element={<CheckoutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/trackorder" element={<TrackOrderPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/chat" element={<ChatAssistantPage />} />
              <Route path="/help" element={<HelpContactPage />} />
              <Route path="/contact" element={<HelpContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<RegisterPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot" element={<ForgotPasswordPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Customer Routes */}
              <Route
                path="/myorders"
                element={
                  <ProtectedRoute>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/addresses"
                element={
                  <ProtectedRoute>
                    <AddressesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/address"
                element={
                  <ProtectedRoute>
                    <AddressesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Logistics/Delivery Routes */}
              <Route
                path="/delivery-dashboard"
                element={
                  <ProtectedRoute>
                    <DeliveryDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Admin Portal Layout (Strict Admin Access Control) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="returns" element={<AdminReturnsPage />} />
              <Route path="stock" element={<AdminStockPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
