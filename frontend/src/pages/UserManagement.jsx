import { useState, useEffect } from 'react';
import UserService from '../services/user.service';
import '../styles/layout.css';

/**
 * Admin panel for managing users.
 */
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch users when the component mounts
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await UserService.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError('Failed to load users. Please check your permissions.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles the activation of a specific user.
     * @param {string} email 
     */
    const handleActivate = async (email) => {
        try {
            await UserService.activateUser(email);
            // Refresh the list after successful activation
            fetchUsers();
        } catch (err) {
            alert('Failed to activate user: ' + email);
        }
    };

    return (
        <div className="app-layout">
            <div className="page-container">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">Manage platform accounts and permissions.</p>

                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                {isLoading ? (
                    <p>Loading users...</p>
                ) : (
                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Role</th>
                                    <th style={styles.th}>Major</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.email} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={styles.td}>
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td style={styles.td}>{user.email}</td>
                                        <td style={styles.td}>
                                            <span style={styles.roleBadge(user.role)}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={styles.td}>{user.major || '-'}</td>
                                        <td style={styles.td}>
                                            <span style={{
                                                color: user.active ? '#10b981' : '#ef4444',
                                                fontWeight: '600',
                                                fontSize: '13px'
                                            }}>
                                                {user.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {!user.active && (
                                                <button 
                                                    onClick={() => handleActivate(user.email)}
                                                    style={styles.activateBtn}
                                                >
                                                    Activate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// Inline styles for the table elements
const styles = {
    th: {
        textAlign: 'left',
        padding: '12px 20px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#4b5563',
        textTransform: 'uppercase',
    },
    td: {
        padding: '16px 20px',
        fontSize: '14px',
        color: '#1f2937',
    },
    activateBtn: {
        background: '#10b981',
        color: '#fff',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        cursor: 'pointer',
        fontWeight: '600'
    },
    roleBadge: (role) => {
        let bg = '#f3f4f6';
        let color = '#4b5563';
        
        if (role === 'ADMINISTRATOR') { bg = '#fee2e2'; color = '#b91c1c'; }
        if (role === 'TEACHER') { bg = '#e0e7ff'; color = '#4338ca'; }
        if (role === 'STUDENT') { bg = '#dcfce3'; color = '#15803d'; }

        return {
            background: bg,
            color: color,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
        };
    }
};

export default UserManagement;