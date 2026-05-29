import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import NotificationService from '../services/notification.service';
import '../styles/layout.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [userRole, setUserRole] = useState('');

    const loadNotificationsFromService = (role) => {
        if (role) {
            setNotifications(NotificationService.getNotifications(role));
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
                loadNotificationsFromService(decoded.role);

                // Synchronize when state updates from the navbar dropdown menu
                const handleSync = () => {
                    loadNotificationsFromService(decoded.role);
                };
                window.addEventListener('notifications-changed', handleSync);
                return () => window.removeEventListener('notifications-changed', handleSync);
            } catch (error) { console.error("Invalid token"); }
        }
    }, []);

    const handleToggleRead = (id) => {
        const updated = notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n);
        setNotifications(updated);
        NotificationService.saveNotifications(userRole, updated);
        
        // Notify the navbar component to recalculate the unread counter
        window.dispatchEvent(new Event('notifications-changed'));
    };

    const handleDelete = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        NotificationService.saveNotifications(userRole, updated);
        
        // Notify the navbar component to update accordingly
        window.dispatchEvent(new Event('notifications-changed'));
    };

    const handleMarkAllRead = () => {
        const updated = notifications.map(n => ({ ...n, unread: false }));
        setNotifications(updated);
        NotificationService.saveNotifications(userRole, updated);
        
        // Notify the navbar component to reset the unread counter
        window.dispatchEvent(new Event('notifications-changed'));
    };

    return (
        <div className="app-layout">
            <div className="page-container">
                <div className="page-header">
                    <div className="page-header-text">
                        <h1 className="page-title">Notifications</h1>
                        <p className="page-subtitle">View, manage, and clear your platform alerts.</p>
                    </div>
                    {notifications.length > 0 && (
                        <div className="page-header-actions">
                            <button onClick={handleMarkAllRead} className="logout-button btn-action" style={{ fontSize: '12px', height: '35px' }}>
                                Mark All as Read
                            </button>
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                            📭 You have no notifications.
                        </div>
                    ) : (
                        <div>
                            {notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '20px', 
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: notif.unread ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                        borderLeft: notif.unread ? '4px solid #3b82f6' : '4px solid transparent'
                                    }}
                                >
                                    <div style={{ textAlign: 'left', flex: 1, marginRight: '20px' }}>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#fff', fontWeight: notif.unread ? '600' : '400' }}>
                                            {notif.text}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '11px', opacity: 0.5 }}>
                                            {notif.time}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button 
                                            onClick={() => handleToggleRead(notif.id)}
                                            className="logout-button btn-action"
                                            style={{ height: '32px', minWidth: '90px', fontSize: '12px', padding: '0 10px' }}
                                        >
                                            {notif.unread ? 'Mark Read' : 'Mark Unread'}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(notif.id)}
                                            className="logout-button btn-action"
                                            style={{ height: '32px', minWidth: '40px', fontSize: '12px', padding: '0 10px', borderColor: '#ef4444', color: '#ef4444' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;