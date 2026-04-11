import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { MainLayout } from './components/layout/MainLayout';
import { StaffPartnerProductRequestsPage } from './pages/staff/StaffPartnerProductRequestsPage';

import { Login } from './pages/auth/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { OrderManagement } from './pages/order/OrderManagement';
import { PartnerApprovals } from './pages/PartnerApprovals';
import { InstockProductsPage } from './pages/manager/instock-products/InstockProductsPage';
import { ProductEditorPage } from './pages/manager/product-editor/ProductEditorPage';
import PriceManagementPage from './pages/manager/price/PriceManagementPage';
import { Toaster } from './components/ui/sonner';
import { InventoryManagementPage } from './pages/manager/inventory/InventoryManagement';
import { TicketManagement } from './pages/support/TicketManagement';
import FeedbackManagement from './pages/feedback/FeedbackManagement';
import { PartnerProductsPage } from "./pages/partner-products/PartnerProductsPage";
import { PartnerProductCreatePage } from "./pages/partner-products/PartnerProductCreatePage";
import { PartnerProductEditPage } from "./pages/partner-products/PartnerProductEditPage";
import { ImportServiceConfigsPage } from './pages/ImportServiceConfigsPage';
import RequestManagement from './pages/requests/RequestManagement';
import RequirementManagement from './pages/requirement/RequirementManagement';
import { ProductionTemplatePage } from './pages/production-template/ProductionTemplatePage';
import QuotationPage from './pages/quotation/QuotationPage';
import SystemConfigurationsPage from './pages/system-config/SystemConfigurationsPage';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import CatalogPage from './pages/catalog/CatalogPage';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      refetchOnMount: true,
      refetchOnReconnect: true,
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
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
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
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <PartnerApprovals />
                </ProtectedRoute>
              }
            />

            <Route
              path="/partner-products"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <PartnerProductsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/partner-products/new"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <PartnerProductCreatePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/partner-products/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <PartnerProductEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalog-management"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <CatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/import-service-configs"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <ImportServiceConfigsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/partner-product-requests"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Business Manager']}>
                  <StaffPartnerProductRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback-management"
              element={
                <ProtectedRoute allowedRoles={['Business Manager', 'Staff']}>
                  <FeedbackManagement />
                </ProtectedRoute>
              }
            />

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

            <Route
              path="/support-tickets"
              element={
                <ProtectedRoute allowedRoles={['Staff', "Business Manager"]}>
                  <TicketManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/requests"
              element={
                <ProtectedRoute allowedRoles={['Staff', "Business Manager"]}>
                  <RequestManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/requests/:id/quotation"
              element={
                <ProtectedRoute allowedRoles={['Staff', "Business Manager"]}>
                  <QuotationPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/requirements"
              element={
                <ProtectedRoute allowedRoles={['Staff', "Business Manager"]}>
                  <RequirementManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/production-template"
              element={
                <ProtectedRoute allowedRoles={['Staff', "Business Manager"]}>
                  <ProductionTemplatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-configurations"
              element={
                <ProtectedRoute allowedRoles={['Business Manager']}>
                  <SystemConfigurationsPage />
                </ProtectedRoute>
              }
              />
            
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;