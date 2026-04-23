import { useState, useEffect, useMemo, useRef } from 'react';
import UserService from '../services/user.service';
import AuthService from '../services/auth.service'; // Import pour la création
import '../styles/layout.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    
    // États pour l'Édition
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ 
        firstName: '', lastName: '', role: '', major: '' 
    });

    // États pour la Création
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        email: '', firstName: '', lastName: '', role: 'STUDENT', major: '', password: ''
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

    // --- UTILITAIRE DE NETTOYAGE ---
    const sanitizeString = (str) => {
        if (!str) return '';
        // Retire les accents et les espaces inutiles
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    };

    // --- ACTIONS DE MODIFICATION ---
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({ 
            firstName: user.firstName || '', 
            lastName: user.lastName || '', 
            role: user.role || 'STUDENT', 
            major: user.major || '' 
        });
        setIsEditModalOpen(true);
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        if (!editingUser?.email) return;

        // Validation & Nettoyage
        const sanitizedData = {
            ...editingUser,
            firstName: sanitizeString(editFormData.firstName),
            lastName: sanitizeString(editFormData.lastName),
            role: editFormData.role,
            major: sanitizeString(editFormData.major)
        };

        if (!sanitizedData.firstName || !sanitizedData.lastName) {
            alert("First Name and Last Name cannot be empty.");
            return;
        }

        try {
            await UserService.updateUser(editingUser.email, sanitizedData);
            setIsEditModalOpen(false);
            setEditingUser(null);
            fetchUsers(false);
        } catch (err) { alert("Error updating user."); }
    };

    // --- ACTIONS DE CRÉATION ---
    const handleOpenCreateModal = () => {
        setCreateFormData({ email: '', firstName: '', lastName: '', role: 'STUDENT', major: '', password: '' });
        setIsCreateModalOpen(true);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        // Validation & Nettoyage
        const sanitizedData = {
            email: createFormData.email.trim().toLowerCase(),
            firstName: sanitizeString(createFormData.firstName),
            lastName: sanitizeString(createFormData.lastName),
            role: createFormData.role,
            major: sanitizeString(createFormData.major),
            password: createFormData.password
        };

        if (!sanitizedData.email || !sanitizedData.firstName || !sanitizedData.lastName || !sanitizedData.password) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            await AuthService.register(sanitizedData);
            setIsCreateModalOpen(false);
            fetchUsers();
        } catch (err) {
            if (err.response && err.response.status === 409) {
                alert("This email is already registered.");
            } else {
                alert("Error creating user.");
            }
        }
    };

    // --- CHANGEMENT DE STATUT DIRECT ---
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                    <h1 className="page-title" style={{ margin: 0 }}>User Management</h1>
                    <button 
                        onClick={handleOpenCreateModal} 
                        className="auth-button btn-action" 
                        style={{ gap: '8px' }}
                    >
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Add User
                    </button>
                </div>
                
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
                                        <th style={{ width: '15%', padding: '15px' }} className="sortable-header" onClick={() => requestSort('major')}>Major {getSortIcon('major')}</th>
                                        <th style={{ width: '10%', padding: '15px', textAlign: 'center' }}>Status</th>
                                        <th style={{ width: '15%', padding: '15px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedUsers.map(user => (
                                        <tr key={user.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>{user.firstName || 'N/A'} {user.lastName || ''}</td>
                                            <td style={{ padding: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }} title={user.email}>{user.email}</td>
                                            <td style={{ padding: '15px', fontSize: '13px', verticalAlign: 'middle' }}>{user.role}</td>
                                            <td style={{ padding: '15px', fontSize: '13px', verticalAlign: 'middle' }}>{user.major || 'N/A'}</td>
                                            <td style={{ padding: '15px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                {/* STATUT CLIQUABLE */}
                                                <span 
                                                    onClick={() => handleToggleStatus(user)}
                                                    style={{ 
                                                        padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                                        color: user.active ? '#86efac' : '#fca5a5', 
                                                        background: user.active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                        border: `1px solid ${user.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                    title="Click to toggle status"
                                                >
                                                    {user.active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                    <button onClick={() => handleEditClick(user)} className="logout-button btn-action" style={{ minWidth: '70px', padding: '0 10px' }}>Edit</button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(user)} 
                                                        className="logout-button btn-action" 
                                                        style={{ minWidth: '70px', padding: '0 10px', borderColor: '#ef4444', color: '#ef4444' }}
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

                {/* MODALE DE CRÉATION */}
                {isCreateModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.3s ease' }}>
                            <h3 style={{ marginBottom: '20px', marginTop: 0 }}>Register New User</h3>
                            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">Email Address *</label>
                                    <input type="email" name="email" className="auth-input" value={createFormData.email} onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})} required />
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">First Name *</label>
                                        <input name="firstName" className="auth-input" value={createFormData.firstName} onChange={(e) => setCreateFormData({...createFormData, firstName: e.target.value})} required />
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Last Name *</label>
                                        <input name="lastName" className="auth-input" value={createFormData.lastName} onChange={(e) => setCreateFormData({...createFormData, lastName: e.target.value})} required />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Role</label>
                                        <select name="role" className="auth-input" value={createFormData.role} onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}>
                                            <option value="STUDENT">STUDENT</option>
                                            <option value="TEACHER">TEACHER</option>
                                            <option value="GUEST">GUEST</option>
                                            <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                        </select>
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Major</label>
                                        <input name="major" className="auth-input" value={createFormData.major} onChange={(e) => setCreateFormData({...createFormData, major: e.target.value})} />
                                    </div>
                                </div>
                                <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                    <label className="auth-label">Password *</label>
                                    <input type="password" name="password" className="auth-input" value={createFormData.password} onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})} required />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="logout-button btn-action">Cancel</button>
                                    <button type="submit" className="auth-button btn-action">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODALE D'ÉDITION */}
                {isEditModalOpen && editingUser && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                        <div className="glass-card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.3s ease' }}>
                            <h3 style={{ marginBottom: '5px', marginTop: 0 }}>Edit User</h3>
                            <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>{editingUser.email}</p>
                            <form onSubmit={handleSaveUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">First Name *</label>
                                        <input name="firstName" className="auth-input" value={editFormData.firstName} onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})} required />
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Last Name *</label>
                                        <input name="lastName" className="auth-input" value={editFormData.lastName} onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})} required />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Role</label>
                                        <select name="role" className="auth-input" value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}>
                                            <option value="STUDENT">STUDENT</option>
                                            <option value="TEACHER">TEACHER</option>
                                            <option value="GUEST">GUEST</option>
                                            <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                        </select>
                                    </div>
                                    <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label className="auth-label">Major</label>
                                        <input name="major" className="auth-input" value={editFormData.major} onChange={(e) => setEditFormData({...editFormData, major: e.target.value})} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="logout-button btn-action">Cancel</button>
                                    <button type="submit" className="auth-button btn-action">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

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