import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { OrderManagement } from './pages/OrderManagement';
import { PartnerApprovals } from './pages/PartnerApprovals';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes Wrapper */}
        <Route element={<AdminLayout />}>
          
          {/* Dashboard: Accessible by both STAFF and MANAGER */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'MANAGER']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Orders: Accessible by both STAFF and MANAGER */}
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'MANAGER']}>
                <OrderManagement />
              </ProtectedRoute>
            } 
          />

          {/* Partner Approvals: Accessible ONLY by MANAGER */}
          <Route 
            path="/partners" 
            element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <PartnerApprovals />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
