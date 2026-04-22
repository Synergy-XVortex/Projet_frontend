import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Companies from './pages/Companies';

/**
 * MainLayout component that includes the Navbar for authenticated users.
 * The <Outlet /> component renders the specific child route.
 */
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

/**
 * Main application component responsible for global routing and security logic.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* =========================================
            PUBLIC ROUTES (No authentication required)
            ========================================= */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* =========================================
            PROTECTED ROUTES (Authentication required)
            ========================================= */}
        <Route element={
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        }>
            
            {/* General access for all logged-in roles */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Vraie route vers la page Entreprises */}
            <Route path="/companies" element={<Companies />} />
            
            {/* Placeholder route for future implementation */}
            <Route path="/internships" element={
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <h2>Internships List</h2>
                    <p>Coming soon...</p>
                </div>
            } />

            {/* =========================================
                ADMIN ONLY ROUTES
                ========================================= */}
            <Route 
                path="/admin/users" 
                element={
                    <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                        <UserManagement /> 
                    </ProtectedRoute>
                } 
            />
            
        </Route>

        {/* Catch-all route for non-existent URLs (404) */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;