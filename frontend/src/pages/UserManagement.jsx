import { useState, useEffect } from 'react';
import UserService from '../services/user.service';
import '../styles/layout.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState({ 
        email: '', role: '', firstName: '', lastName: '', major: '' 
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await UserService.getAllUsers();
            // SÉCURITÉ : On vérifie que response.data est bien un tableau avant de l'utiliser
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                setErrorMessage("L'API n'a pas renvoyé une liste valide.");
                setUsers([]);
            }
        } catch (err) {
            console.error("Failed to load users", err);
            setErrorMessage("Erreur d'accès : Vérifiez que vous êtes connecté en tant qu'ADMINISTRATOR.");
            setUsers([]); // Fallback sécurisé
        } finally {
            setIsLoading(false);
        }
    };

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
            fetchUsers();
        } catch (err) {
            alert("Erreur lors de la mise à jour (Erreur 403 potentielle).");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await UserService.toggleUserStatus(user);
            fetchUsers(); // Rafraîchit la liste pour voir le changement
        } catch (err) {
            console.error("Erreur de statut", err);
            alert("Erreur : Vérifiez que vous avez les droits d'administration.");
        }
    };

    const buttonStyle = { width: '110px', height: '38px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0' };

    return (
        <div className="app-layout">
            <div className="page-container">
                <h1 className="page-title">User Management</h1>
                
                {errorMessage && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {errorMessage}
                    </div>
                )}
                
                {editingUser && (
                    <div className="glass-card" style={{ marginBottom: '30px' }}>
                        <h3>Edit User Profile</h3>
                        <form onSubmit={handleSaveUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                            <div className="auth-input-group">
                                <label className="auth-label">First Name</label>
                                <input className="auth-input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-label">Last Name</label>
                                <input className="auth-input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-label">Role</label>
                                <select className="auth-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                    <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                </select>
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-label">Major</label>
                                <input className="auth-input" value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', paddingBottom: '18px' }}>
                                <button type="submit" className="auth-button" style={buttonStyle}>Save</button>
                                <button type="button" onClick={() => setEditingUser(null)} className="logout-button" style={buttonStyle}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    {isLoading ? (
                        <p style={{ padding: '30px' }}>Chargement des utilisateurs...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>Identity</th>
                                        <th style={{ padding: '15px' }}>Email</th>
                                        <th style={{ padding: '15px' }}>Role</th>
                                        <th style={{ padding: '15px' }}>Major</th>
                                        <th style={{ padding: '15px' }}>Status</th>
                                        <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* SÉCURITÉ : React map uniquement si users a bien des données */}
                                    {Array.isArray(users) && users.map(user => (
                                        <tr key={user.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <td style={{ padding: '15px' }}>{user.firstName || 'N/A'} {user.lastName || ''}</td>
                                            <td style={{ padding: '15px' }}>{user.email}</td>
                                            <td style={{ padding: '15px' }}>{user.role}</td>
                                            <td style={{ padding: '15px' }}>{user.major || '-'}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ color: user.active ? '#86efac' : '#fca5a5', fontWeight: 'bold' }}>
                                                    {user.active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                <button onClick={() => handleEditClick(user)} className="logout-button" style={buttonStyle}>Edit</button>
                                                <button onClick={() => handleToggleStatus(user)} className="auth-button" style={{ ...buttonStyle, background: user.active ? 'rgba(239, 68, 68, 0.6)' : '' }}>
                                                    {user.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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