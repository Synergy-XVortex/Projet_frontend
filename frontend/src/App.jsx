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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/notifications" element={<Notifications />} /> {/* <-- NOUVELLE ROUTE */}

            <Route 
                path="/admin/users" 
                element={
                    <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                        <UserManagement /> 
                    </ProtectedRoute>
                } 
            />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;