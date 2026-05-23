import { useState, useEffect } from 'react';
import UserService from '../services/user.service';
import '../styles/layout.css';

const Profile = () => {
    const [formData, setFormData] = useState({
        email: '', firstName: '', lastName: '', role: '', major: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await UserService.getMyProfile();
            setFormData(res.data);
        } catch (error) {
            setMessage({ text: 'Error loading profile', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await UserService.updateMyProfile(formData);
            setMessage({ text: 'Profile successfully updated!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: 'Failed to update profile', type: 'error' });
        }
    };

    if (isLoading) return <div className="app-layout"><div className="page-container"><p>Loading profile...</p></div></div>;

    return (
        <div className="app-layout">
            <div className="page-container">
                <div className="page-header">
                    <div className="page-header-text">
                        <h1 className="page-title">My Profile</h1>
                        <p className="page-subtitle">Manage your personal information.</p>
                    </div>
                </div>

                {message.text && (
                    <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', 
                        background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                        color: message.type === 'success' ? '#86efac' : '#fca5a5',
                        border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <div className="glass-card" style={{ maxWidth: '600px' }}>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="auth-label">First Name</label>
                                <input className="auth-input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                            </div>
                            <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="auth-label">Last Name</label>
                                <input className="auth-input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                            </div>
                        </div>

                        <div className="auth-input-group" style={{ marginBottom: 0 }}>
                            <label className="auth-label">Email Address (Read-only)</label>
                            <input className="auth-input" value={formData.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="auth-label">Role (Read-only)</label>
                                <input className="auth-input" value={formData.role} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                            </div>
                            <div className="auth-input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="auth-label">Major / Specialization</label>
                                <input className="auth-input" value={formData.major || ''} onChange={e => setFormData({...formData, major: e.target.value})} />
                            </div>
                        </div>

                        <button type="submit" className="auth-button btn-action" style={{ marginTop: '10px' }}>
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;