import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Companies from './pages/Companies';
import Internships from './pages/Internships';
import ProfileWidget from './components/ProfileWidget'; // <-- IMPORT DU WIDGET

/**
 * MainLayout component that includes the Navbar for authenticated users.
 * The <Outlet /> component renders the specific child route.
 * ProfileWidget is included here so it floats on every authenticated page.
 */
const MainLayout = () => {
    return (
        <>
            <Navbar />
            <div className="main-content">
                <Outlet />
            </div>
            {/* INJECTION DU BOUTON FLOTTANT ICI */}
            <ProfileWidget /> 
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
        
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/internships" element={<Internships />} />

            <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                    <UserManagement /> 
                </ProtectedRoute>
            } />
            
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;