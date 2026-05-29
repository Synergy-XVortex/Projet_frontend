import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import NotificationService from '../services/notification.service';
import '../styles/layout.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [userRole, setUserRole] = useState('');

    const loadNotificationsFromService = async () => {
        try {
            const res = await NotificationService.getNotifications();
            setNotifications(res.data || []);
        } catch (error) {
            console.error("Failed to fetch notifications from DB", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role);
                loadNotificationsFromService();

                // Synchronize across components when custom event fires
                window.addEventListener('notifications-changed', loadNotificationsFromService);
                return () => window.removeEventListener('notifications-changed', loadNotificationsFromService);
            } catch (error) { console.error("Invalid token"); }
        }
    }, []);

    const handleToggleRead = async (id) => {
        try {
            await NotificationService.toggleRead(id);
            window.dispatchEvent(new Event('notifications-changed'));
        } catch (error) {
            console.error("Failed to update notification read status", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await NotificationService.deleteNotification(id);
            window.dispatchEvent(new Event('notifications-changed'));
        } catch (error) {
            console.error("Failed to delete notification from DB", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            window.dispatchEvent(new Event('notifications-changed'));
        } catch (error) {
            console.error("Failed to clean notifications", error);
        }
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
                                        background: !notif.read ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                        borderLeft: !notif.read ? '4px solid #3b82f6' : '4px solid transparent'
                                    }}
                                >
                                    <div style={{ textAlign: 'left', flex: 1, marginRight: '20px' }}>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#fff', fontWeight: !notif.read ? '600' : '400' }}>
                                            {notif.message}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '11px', opacity: 0.5 }}>
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button 
                                            onClick={() => handleToggleRead(notif.id)}
                                            className="logout-button btn-action"
                                            style={{ height: '32px', minWidth: '90px', fontSize: '12px', padding: '0 10px' }}
                                        >
                                            {!notif.read ? 'Mark Read' : 'Mark Unread'}
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