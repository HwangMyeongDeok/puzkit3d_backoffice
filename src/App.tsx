import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { MainLayout } from './components/layout/MainLayout';

import { Login } from './pages/auth/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/order/Dashboard';
import { OrderManagement } from './pages/OrderManagement';
import { PartnerApprovals } from './pages/PartnerApprovals';
import { InstockProductsPage } from './pages/manager/instock-products/InstockProductsPage';
import { ProductEditorPage } from './pages/manager/product-editor/ProductEditorPage';
import  PriceManagementPage  from './pages/manager/price/PriceManagementPage';
import { Toaster } from './components/ui/sonner';
import { InventoryManagementPage } from './pages/manager/inventory/InventoryManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes Wrapper - Bọc từ ngoài cửa để chặn user chưa login */}
          <Route 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <OrderManagement />
                </ProtectedRoute>
              }
            />

            {/* Partner Approvals: Accessible ONLY by MANAGER */}
            <Route
              path="/partners"
              element={
                <ProtectedRoute allowedRoles={['Business Manager']}>
                  <PartnerApprovals />
                </ProtectedRoute>
              }
            />

            {/* Products: Accessible ONLY by MANAGER */}

            {/* Product Editor: Create & Edit Instock Products */}
            <Route
              path="/instock-products/new"
              element={
                <ProtectedRoute allowedRoles={['Business Manager']}>
                  <ProductEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instock-products/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Business Manager']}>
                  <ProductEditorPage />
                </ProtectedRoute>
              }
            />

            {/* Instock Products Management: Accessible by STAFF and MANAGER */}
            <Route
              path="/instock-products"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <InstockProductsPage />
                </ProtectedRoute>
              }
            />

            {/* Price Management: Accessible by MANAGER only */}
            <Route
              path="/price-management"
              element={
                <ProtectedRoute allowedRoles={['Business Manager']}>
                  <PriceManagementPage />
                </ProtectedRoute>
              }
            />

             <Route
              path="/inventory-management"
              element={
                <ProtectedRoute allowedRoles={['Business Manager']}>
                  <InventoryManagementPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - Redirect URL bậy bạ về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;