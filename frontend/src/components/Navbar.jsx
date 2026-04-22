import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthService from '../services/auth.service';
import '../styles/layout.css';

/**
 * Navigation Bar component that dynamically adapts links based on the user's role.
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

    /**
     * Determines which links to display based on the user's role.
     * This keeps the JSX clean and scalable.
     */
    const getNavLinks = (role) => {
        // Everyone gets access to their respective Dashboard
        const links = [{ path: '/dashboard', label: 'Dashboard' }];

        switch (role) {
            case 'STUDENT':
                links.push({ path: '/internships', label: 'My Internship' });
                links.push({ path: '/companies', label: 'Companies' });
                break;
            case 'TEACHER':
                links.push({ path: '/internships', label: 'Student Internships' });
                links.push({ path: '/companies', label: 'Companies' });
                break;
            case 'GUEST':
                links.push({ path: '/companies', label: 'Companies Directory' });
                break;
            case 'ADMINISTRATOR':
                links.push({ path: '/companies', label: 'Companies Directory' });
                links.push({ path: '/admin/users', label: 'User Management' });
                break;
            default:
                break;
        }

        return links;
    };

    const navLinks = getNavLinks(userRole);

    return (
        <nav className="navbar">
            <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                Academic<span>Platform</span>
            </div>

            <div className="navbar-links">
                {navLinks.map((link) => (
                    <NavLink 
                        key={link.path} 
                        to={link.path} 
                        // NavLink automatically provides an 'isActive' boolean
                        className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                    >
                        {link.label}
                    </NavLink>
                ))}
            </div>

            <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span className="user-info" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#fff' }}>{userEmail}</strong> 
                    <span style={{ 
                        marginLeft: '8px', 
                        padding: '3px 8px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '12px', 
                        fontSize: '11px' 
                    }}>
                        {userRole}
                    </span>
                </span>
                <button onClick={handleLogout} className="logout-button" style={{ margin: 0 }}>
                    Sign Out
                </button>
            </div>
        </nav>
    );
};

export default Navbar;