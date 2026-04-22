import { useState, useEffect, useMemo } from 'react';
import UserService from '../services/user.service';
import '../styles/layout.css';

/**
 * Management page to view, edit, and activate/deactivate users.
 * Features: Tabs filtering, Search, Sorting, and Optimistic UI updates.
 */
const UserManagement = () => {
    // Basic Data State
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    
    // Editing State
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ 
        email: '', role: '', firstName: '', lastName: '', major: '' 
    });

    // Dynamic UI States
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await UserService.getAllUsers();
            if (Array.isArray(response.data)) {
                setErrorMessage('');
                setUsers(response.data);
            } else {
                setErrorMessage(`Format error: API did not return an array.`);
                setUsers([]);
            }
        } catch (err) {
            console.error("Failed to load users", err);
            setErrorMessage("Connection error or unauthorized access.");
            setUsers([]); 
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // --- Dynamic Filtering & Sorting Logic (useMemo for performance) ---
    const processedUsers = useMemo(() => {
        let processableUsers = [...users];

        // 1. Filter by Tab (Role)
        if (activeTab !== 'ALL') {
            processableUsers = processableUsers.filter(user => user.role === activeTab);
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            processableUsers = processableUsers.filter(user => 
                (user.firstName?.toLowerCase().includes(lowercasedTerm)) ||
                (user.lastName?.toLowerCase().includes(lowercasedTerm)) ||
                (user.email?.toLowerCase().includes(lowercasedTerm)) ||
                (user.major?.toLowerCase().includes(lowercasedTerm))
            );
        }

        // 3. Sort by Column
        if (sortConfig.key !== null) {
            processableUsers.sort((a, b) => {
                let aValue = a[sortConfig.key] || '';
                let bValue = b[sortConfig.key] || '';
                
                // Convert to lowercase strings for case-insensitive sorting
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return processableUsers;
    }, [users, activeTab, searchTerm, sortConfig]);

    // Handle column header click for sorting
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Visual indicator for sorting (↑ or ↓)
    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return ' ↕';
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    // --- Actions ---
    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({ 
            email: user.email || '', 
            role: user.role || 'STUDENT',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            major: user.major || ''
        });
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        if (!editingUser?.email) return;

        try {
            const updatedData = { ...editingUser, ...formData };
            await UserService.updateUser(editingUser.email, updatedData);
            setEditingUser(null);
            fetchUsers(false); // Silent reload
        } catch (err) {
            alert("Error updating user.");
        }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = !user.active;

        // Optimistic UI update
        setUsers(users.map(u => {
            if (u.email === user.email) return { ...u, active: newStatus };
            return u;
        }));

        try {
            await UserService.toggleUserStatus(user);
            fetchUsers(false); // Silent sync with DB
        } catch (err) {
            console.error("Toggle status error:", err);
            alert("Server communication error. Status will be reverted.");
            fetchUsers(true); // Revert on failure
        }
    };

    const buttonStyle = { width: '100px', height: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0', fontSize: '13px' };

    return (
        <div className="app-layout">
            <div className="page-container">
                <h1 className="page-title">User Management</h1>
                
                {errorMessage && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {errorMessage}
                    </div>
                )}
                
                {/* Dynamic Controls: Tabs & Search */}
                <div className="controls-container">
                    <div className="tabs-container">
                        {/* CHANGEMENT ICI : GUEST à la place de SUPERVISOR */}
                        {['ALL', 'STUDENT', 'TEACHER', 'GUEST', 'ADMINISTRATOR'].map(role => (
                            <button 
                                key={role}
                                className={`tab-button ${activeTab === role ? 'active' : ''}`}
                                onClick={() => setActiveTab(role)}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    <div className="search-container">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search by name, email, major..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Edit Form */}
                {editingUser && (
                    <div className="glass-card" style={{ marginBottom: '30px', animation: 'fadeIn 0.3s ease' }}>
                        <h3>Edit Profile: {editingUser.email}</h3>
                        <form onSubmit={handleSaveUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">First Name</label>
                                <input name="firstName" className="auth-input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                            </div>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">Last Name</label>
                                <input name="lastName" className="auth-input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                            </div>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">Role</label>
                                {/* CHANGEMENT ICI : GUEST à la place de SUPERVISOR */}
                                <select name="role" className="auth-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="TEACHER">TEACHER</option>
                                    <option value="GUEST">GUEST</option>
                                    <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                </select>
                            </div>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">Major</label>
                                <input name="major" className="auth-input" value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', paddingBottom: '2px' }}>
                                <button type="submit" className="auth-button" style={buttonStyle}>Save</button>
                                <button type="button" onClick={() => setEditingUser(null)} className="logout-button" style={buttonStyle}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Main Table */}
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {isLoading ? (
                        <p style={{ padding: '30px', textAlign: 'center' }}>Loading user data...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            {/* FIXED TABLE LAYOUT: Prevents column resizing when content changes */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <tr>
                                        {/* Fixed widths applied to TH elements */}
                                        <th style={{ width: '20%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('firstName')}>
                                            Identity {getSortIcon('firstName')}
                                        </th>
                                        <th style={{ width: '25%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('email')}>
                                            Email Address {getSortIcon('email')}
                                        </th>
                                        <th style={{ width: '15%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('role')}>
                                            Role {getSortIcon('role')}
                                        </th>
                                        <th style={{ width: '15%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('major')}>
                                            Major {getSortIcon('major')}
                                        </th>
                                        <th style={{ width: '10%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('active')}>
                                            Status {getSortIcon('active')}
                                        </th>
                                        <th style={{ width: '15%', padding: '15px', textAlign: 'center' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                                                No users found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        processedUsers.map(user => (
                                            <tr key={user.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                                {/* Added textOverflow logic to handle long emails gracefully within fixed columns */}
                                                <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {user.firstName || 'N/A'} {user.lastName || ''}
                                                </td>
                                                <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user.email}>
                                                    {user.email}
                                                </td>
                                                <td style={{ padding: '15px', fontSize: '13px' }}>{user.role}</td>
                                                <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.major || '-'}</td>
                                                <td style={{ padding: '15px' }}>
                                                    <span style={{ 
                                                        padding: '4px 10px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '11px',
                                                        color: user.active ? '#86efac' : '#fca5a5', 
                                                        background: user.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        fontWeight: 'bold',
                                                        border: `1px solid ${user.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                                    }}>
                                                        {user.active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleEditClick(user)} className="logout-button" style={buttonStyle}>Edit</button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(user)} 
                                                        className="auth-button" 
                                                        style={{ 
                                                            ...buttonStyle, 
                                                            background: user.active ? 'rgba(239, 68, 68, 0.6)' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' 
                                                        }}
                                                    >
                                                        {user.active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;