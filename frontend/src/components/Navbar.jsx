import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthService from '../services/auth.service';
import NotificationService from '../services/notification.service';
import '../styles/layout.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // UI states
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]); 
    const dropdownRef = useRef(null);
    
    // --- THEME MANAGEMENT ---
    const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('app_theme', newTheme);
            if (newTheme === 'light') {
                document.body.classList.add('light-theme');
            } else {
                document.body.classList.remove('light-theme');
            }
            return newTheme;
        });
    };

    // Apply theme on component mount
    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [theme]);

    // Keyboard shortcut (Alt + T) to toggle theme
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                toggleTheme();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    // -------------------------

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const token = localStorage.getItem('jwt_token');
    let userRole = '';
    let userEmail = '';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded.role;
            userEmail = decoded.sub;
        } catch (error) { console.error("Invalid token"); }
    }

    // Load notifications from DB and listen for cross-component sync
    useEffect(() => {
        const loadNotifications = async () => {
            if (userRole) {
                try {
                    const res = await NotificationService.getNotifications();
                    setNotifications(res.data || []);
                } catch (error) {
                    console.error("Failed to load notifications from database", error);
                }
            }
        };

        loadNotifications();
        window.addEventListener('notifications-changed', loadNotifications);
        return () => window.removeEventListener('notifications-changed', loadNotifications);
    }, [userRole, location]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-close menus on route navigation
    useEffect(() => {
        closeMobileMenu();
        setIsNotificationOpen(false);
    }, [location]); 

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            window.dispatchEvent(new Event('notifications-changed'));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

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
                links.push({ path: '/internships', label: 'Internships' });
                links.push({ path: '/companies', label: 'Companies Directory' });
                links.push({ path: '/admin/users', label: 'User Management' });
                break;
            default: break;
        }
        return links;
    };

    const navLinks = getNavLinks(userRole);

    return (
        <nav className="navbar">
            <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => { navigate('/dashboard'); closeMobileMenu(); }}>
                Academic<span>Platform</span>
            </div>

            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
                {isMobileMenuOpen ? '✖' : '☰'}
            </button>

            {isMobileMenuOpen && (
                <div className="mobile-overlay" onClick={closeMobileMenu} style={{ position: 'fixed', top: '70px', left: 0, width: '100%', height: '100vh', background: 'transparent', zIndex: 99 }} />
            )}

            <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`} style={{ zIndex: 100 }}>
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenu}>
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-links user-info-container" style={{ flexDirection: 'row', alignItems: 'center' }}>
                    
                    {/* --- THEME SLIDER BUTTON --- */}
                    <div className="theme-switch-wrapper" title="Toggle Light/Dark Theme (Alt + T)">
                        <label className="theme-switch" htmlFor="theme-checkbox">
                            <input 
                                type="checkbox" 
                                id="theme-checkbox" 
                                checked={theme === 'light'} 
                                onChange={toggleTheme} 
                            />
                            <div className="slider">
                                {/* The icons are positioned underneath the sliding knob */}
                                <span className="slider-icon" title="Dark Mode">🌙</span>
                                <span className="slider-icon" title="Light Mode">☀️</span>
                            </div>
                        </label>
                    </div>

                    {/* NOTIFICATION HUB */}
                    <div className="notification-container" ref={dropdownRef}>
                        <button className="notification-bell" onClick={() => setIsNotificationOpen(!isNotificationOpen)} aria-label="Notifications">
                            🔔
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </button>

                        {isNotificationOpen && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <span>Notifications</span>
                                    {unreadCount > 0 && (
                                        <button className="notification-mark-read" onClick={markAllAsRead}>
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                
                                <div className="notification-list">
                                    {notifications.length > 0 ? (
                                        <>
                                            {notifications.slice(0, 3).map(notif => (
                                                <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                                                    <p className="notification-text">{notif.message}</p>
                                                    <p className="notification-time">{new Date(notif.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            ))}
                                            <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => { navigate('/notifications'); setIsNotificationOpen(false); }}
                                                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    View All Notifications
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="notification-empty">No new notifications.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <span className="user-info" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
                        <strong style={{ color: 'inherit' }}>{userEmail}</strong> 
                        <span style={{ marginLeft: '8px', padding: '3px 8px', background: 'rgba(128,128,128,0.2)', borderRadius: '12px', fontSize: '11px' }}>
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