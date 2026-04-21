import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthService from '../services/auth.service';
import '../styles/layout.css';

/**
 * Navigation Bar component that adapts to the user's role.
 */
const Navbar = () => {
    const navigate = useNavigate();
    
    // Retrieve and decode the token to get user info
    const token = localStorage.getItem('jwt_token');
    let userRole = '';
    let userEmail = '';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded.role;
            userEmail = decoded.sub; // 'sub' typically holds the email in JWT
        } catch (error) {
            console.error("Invalid token");
        }
    }

    /**
     * Handles user logout.
     */
    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/dashboard" className="navbar-brand">
                Academic<span>Platform</span>
            </Link>

            <div className="navbar-links">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/internships" className="nav-link">Internships</Link>
                <Link to="/companies" className="nav-link">Companies</Link>

                {/* Conditional rendering: Only Administrators see this link */}
                {userRole === 'ADMINISTRATOR' && (
                    <Link to="/admin/users" className="nav-link admin-link">
                        Manage Users
                    </Link>
                )}
            </div>

            <div className="navbar-links">
                <span className="user-info">
                    {userEmail} ({userRole})
                </span>
                <button onClick={handleLogout} className="logout-button">
                    Sign Out
                </button>
            </div>
        </nav>
    );
};

export default Navbar;