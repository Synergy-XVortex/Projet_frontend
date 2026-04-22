import { useState, useEffect, useMemo, useRef } from 'react';
import UserService from '../services/user.service';
import '../styles/layout.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ 
        email: '', role: '', firstName: '', lastName: '', major: '' 
    });

    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const [deletedUser, setDeletedUser] = useState(null);
    const deleteTimeoutRef = useRef(null);

    useEffect(() => { fetchUsers(); }, []);

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
            setErrorMessage("Connection error or unauthorized access.");
            setUsers([]); 
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const processedUsers = useMemo(() => {
        let processableUsers = [...users];
        if (activeTab !== 'ALL') processableUsers = processableUsers.filter(user => user.role === activeTab);
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            processableUsers = processableUsers.filter(user => 
                (user.firstName?.toLowerCase().includes(lowercasedTerm)) ||
                (user.lastName?.toLowerCase().includes(lowercasedTerm)) ||
                (user.email?.toLowerCase().includes(lowercasedTerm)) ||
                (user.major?.toLowerCase().includes(lowercasedTerm))
            );
        }
        if (sortConfig.key !== null) {
            processableUsers.sort((a, b) => {
                let aValue = String(a[sortConfig.key] || '').toLowerCase();
                let bValue = String(b[sortConfig.key] || '').toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return processableUsers;
    }, [users, activeTab, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return ' ↕';
        return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({ 
            email: user.email || '', role: user.role || 'STUDENT',
            firstName: user.firstName || '', lastName: user.lastName || '', major: user.major || ''
        });
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        if (!editingUser?.email) return;
        try {
            const updatedData = { ...editingUser, ...formData };
            await UserService.updateUser(editingUser.email, updatedData);
            setEditingUser(null);
            fetchUsers(false);
        } catch (err) { alert("Error updating user."); }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = !user.active;
        setUsers(users.map(u => u.email === user.email ? { ...u, active: newStatus } : u));
        try {
            await UserService.toggleUserStatus(user);
            fetchUsers(false);
        } catch (err) {
            alert("Server error. Status reverted.");
            fetchUsers(true);
        }
    };

    const handleDeleteClick = (user) => {
        setUsers(users.filter(u => u.email !== user.email));
        setDeletedUser(user);
        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        deleteTimeoutRef.current = setTimeout(async () => {
            try {
                await UserService.deleteUser(user.email);
            } catch (err) {
                console.error(err);
                alert("Erreur lors de la suppression.");
                fetchUsers(false); 
            }
            setDeletedUser(null);
        }, 5000);
    };

    const handleUndoDelete = () => {
        if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
            deleteTimeoutRef.current = null;
        }
        if (deletedUser) {
            setUsers(prev => [...prev, deletedUser]);
            setDeletedUser(null);
        }
    };

    return (
        <div className="app-layout">
            <div className="page-container" style={{ position: 'relative' }}>
                <h1 className="page-title">User Management</h1>
                
                {errorMessage && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {errorMessage}
                    </div>
                )}
                
                <div className="controls-container">
                    <div className="tabs-container">
                        {['ALL', 'STUDENT', 'TEACHER', 'GUEST', 'ADMINISTRATOR'].map(role => (
                            <button key={role} className={`tab-button ${activeTab === role ? 'active' : ''}`} onClick={() => setActiveTab(role)}>{role}</button>
                        ))}
                    </div>
                    <div className="search-container">
                        <span className="search-icon">🔍</span>
                        <input type="text" className="search-input" placeholder="Search by name, email, major..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

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
                                <button type="submit" className="auth-button btn-action">Save</button>
                                <button type="button" onClick={() => setEditingUser(null)} className="logout-button btn-action">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {isLoading ? (
                        <p style={{ padding: '30px', textAlign: 'center' }}>Loading user data...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <tr>
                                        <th style={{ width: '20%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('firstName')}>Identity {getSortIcon('firstName')}</th>
                                        <th style={{ width: '25%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('email')}>Email Address {getSortIcon('email')}</th>
                                        <th style={{ width: '15%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('role')}>Role {getSortIcon('role')}</th>
                                        <th style={{ width: '10%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('active')}>Status {getSortIcon('active')}</th>
                                        <th style={{ width: '30%', padding: '15px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedUsers.map(user => (
                                        <tr key={user.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>{user.firstName || 'N/A'} {user.lastName || ''}</td>
                                            <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }} title={user.email}>{user.email}</td>
                                            <td style={{ padding: '15px', fontSize: '13px', verticalAlign: 'middle' }}>{user.role}</td>
                                            <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                                    color: user.active ? '#86efac' : '#fca5a5', 
                                                    background: user.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    border: `1px solid ${user.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                                }}>
                                                    {user.active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                    <button onClick={() => handleEditClick(user)} className="logout-button btn-action">Edit</button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(user)} 
                                                        className="auth-button btn-action" 
                                                        style={{ background: user.active ? 'rgba(239, 68, 68, 0.6)' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}
                                                    >
                                                        {user.active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(user)} 
                                                        className="logout-button btn-action" 
                                                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {deletedUser && (
                    <div style={{
                        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                        background: '#1f2937', color: '#fff', padding: '12px 24px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)', animation: 'slideUp 0.3s ease'
                    }}>
                        <span>User <strong>{deletedUser.email}</strong> deleted.</span>
                        <button onClick={handleUndoDelete} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', padding: 0 }}>UNDO</button>
                    </div>
                )}
                <style>{`@keyframes slideUp { from { bottom: -50px; opacity: 0; } to { bottom: 30px; opacity: 1; } }`}</style>
            </div>
        </div>
    );
};

export default UserManagement;