import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Companies from './pages/Companies';
import Internships from './pages/Internships';
import Notifications from './pages/Notifications';

const MainLayout = () => {
    return (
        <>
            <Navbar />
            <div className="main-content">
                <Outlet />
            </div>
        </>
    );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        }>
            {/* Common Routes for all authenticated users */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Global Companies Directory - Hidden from GUESTS */}
            <Route 
                path="/companies" 
                element={
                    <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'TEACHER', 'STUDENT']}>
                        <Companies />
                    </ProtectedRoute>
                } 
            />

            {/* Specific Company Profile - ONLY for GUESTS */}
            <Route 
                path="/my-company" 
                element={
                    <ProtectedRoute allowedRoles={['GUEST']}>
                        <Companies />
                    </ProtectedRoute>
                } 
            />

            {/* Admin Only Route */}
            <Route 
                path="/admin/users" 
                element={
                    <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                        <UserManagement /> 
                    </ProtectedRoute>
                } 
            />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;