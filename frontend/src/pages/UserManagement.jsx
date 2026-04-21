import { useState, useEffect } from 'react';
import UserService from '../services/user.service';
import '../styles/layout.css';

/**
 * Management page to view, edit and activate/deactivate users.
 * Requires ADMINISTRATOR role.
 */
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

    // 1. On ajoute un paramètre "showLoading" (vrai par défaut) 
    // pour pouvoir recharger la liste discrètement en arrière-plan
    const fetchUsers = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await UserService.getAllUsers();
            
            if (Array.isArray(response.data)) {
                setErrorMessage('');
                setUsers(response.data);
            } else {
                setErrorMessage(`Erreur de format : L'API n'a pas renvoyé un tableau.`);
                setUsers([]);
            }
        } catch (err) {
            console.error("Failed to load users", err);
            if (err.response) {
                setErrorMessage(`Erreur ${err.response.status} : Impossible de récupérer les utilisateurs.`);
            } else {
                setErrorMessage("Erreur de connexion au serveur Backend.");
            }
            setUsers([]); 
        } finally {
            if (showLoading) setIsLoading(false);
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
            alert("Erreur lors de la mise à jour de l'utilisateur.");
        }
    };

    // 2. La nouvelle logique "Optimiste" pour le bouton Activate/Deactivate
    const handleToggleStatus = async (user) => {
        const newStatus = !user.active;

        // ÉTAPE A : Mise à jour immédiate de l'interface React (sans attendre le backend)
        // L'utilisateur a une sensation de réactivité instantanée
        setUsers(users.map(u => {
            if (u.email === user.email) {
                return { ...u, active: newStatus };
            }
            return u;
        }));

        try {
            // ÉTAPE B : On envoie la requête de mise à jour au serveur en arrière-plan
            await UserService.toggleUserStatus(user);
            
            // ÉTAPE C : On rafraîchit les données silencieusement (sans écran de chargement)
            // pour s'assurer que React et la base de données sont parfaitement synchronisés
            fetchUsers(false);
        } catch (err) {
            console.error("Erreur de statut:", err);
            alert("Erreur de communication avec le serveur. Le statut va être réinitialisé.");
            
            // ROLLBACK : Si le serveur a renvoyé une erreur (ex: perte de connexion), 
            // on annule la modification visuelle en rechargeant les vraies données
            fetchUsers(true);
        }
    };

    // Style constant pour uniformiser les boutons d'action
    const buttonStyle = { width: '110px', height: '38px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0' };

    return (
        <div className="app-layout">
            <div className="page-container">
                <h1 className="page-title">User Management</h1>
                
                {/* Affichage des erreurs éventuelles */}
                {errorMessage && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {errorMessage}
                    </div>
                )}
                
                {/* Formulaire d'édition (visible seulement si un utilisateur est sélectionné) */}
                {editingUser && (
                    <div className="glass-card" style={{ marginBottom: '30px' }}>
                        <h3>Edit User Profile</h3>
                        <form onSubmit={handleSaveUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">First Name</label>
                                <input 
                                    name="firstName" /* Attribut ajouté pour la sécurité */
                                    className="auth-input" 
                                    value={formData.firstName} 
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                                />
                            </div>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">Last Name</label>
                                <input 
                                    name="lastName" 
                                    className="auth-input" 
                                    value={formData.lastName} 
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                                />
                            </div>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">Email</label>
                                <input 
                                    name="email" 
                                    className="auth-input" 
                                    disabled 
                                    value={formData.email} 
                                />
                            </div>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">Role</label>
                                <select 
                                    name="role" /* C'est souvent l'absence de ce name qui fait crasher React */
                                    className="auth-input" 
                                    value={formData.role} 
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                >
                                    <option value="STUDENT">STUDENT</option>
                                    <option value="TEACHER">TEACHER</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                    <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                                </select>
                            </div>
                            <div className="auth-input-group" style={{ marginBottom: 0 }}>
                                <label className="auth-label">Major</label>
                                <input 
                                    name="major" 
                                    className="auth-input" 
                                    value={formData.major} 
                                    onChange={(e) => setFormData({...formData, major: e.target.value})} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', paddingBottom: '2px' }}>
                                <button type="submit" className="auth-button" style={buttonStyle}>Save</button>
                                <button type="button" onClick={() => setEditingUser(null)} className="logout-button" style={buttonStyle}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tableau principal avec l'effet Glassmorphism */}
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
                                    {Array.isArray(users) && users.map(user => (
                                        <tr key={user.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <td style={{ padding: '15px' }}>{user.firstName || 'N/A'} {user.lastName || ''}</td>
                                            <td style={{ padding: '15px' }}>{user.email}</td>
                                            <td style={{ padding: '15px' }}>{user.role}</td>
                                            <td style={{ padding: '15px' }}>{user.major || '-'}</td>
                                            <td style={{ padding: '15px' }}>
                                                {/* Utilisation de user.active */}
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
                                            <td style={{ padding: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
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