import { useState, useEffect } from 'react'; // Added useEffect
import { NavLink, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { jwtDecode } from 'jwt-decode';
import AuthService from '../services/auth.service';
import '../styles/layout.css';

/**
 * Navigation Bar component.
 * Added useLocation to force close the menu even when clicking on the current page.
 */
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Hook to listen to URL changes
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Logic to close the menu
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // FAIL-SAFE: Automatically close menu whenever the location changes
    useEffect(() => {
        closeMobileMenu();
    }, [location]); 

    const token = localStorage.getItem('jwt_token');
    let userRole = '';
    let userEmail = '';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded.role;
            userEmail = decoded.sub;
        } catch (error) {
            console.error("Invalid token");
        }
    }

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
        closeMobileMenu();
    };

    const getNavLinks = (role) => {
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
            <div 
                className="navbar-brand" 
                style={{ cursor: 'pointer' }} 
                onClick={() => { navigate('/dashboard'); closeMobileMenu(); }}
            >
                Academic<span>Platform</span>
            </div>

            <button 
                className="mobile-menu-btn" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? '✖' : '☰'}
            </button>

            {/* Added an overlay to close the menu when clicking outside (optional but recommended) */}
            {isMobileMenuOpen && (
                <div 
                    className="mobile-overlay" 
                    onClick={closeMobileMenu}
                    style={{
                        position: 'fixed', top: '70px', left: 0, width: '100%', height: '100vh',
                        background: 'transparent', zIndex: 99
                    }}
                />
            )}

            <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`} style={{ zIndex: 100 }}>
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <NavLink 
                            key={link.path} 
                            to={link.path} 
                            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                            onClick={closeMobileMenu} // Explicitly close even if it's the same page
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-links user-info-container">
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
            </div>
        </nav>
    );
};

export default Navbar;