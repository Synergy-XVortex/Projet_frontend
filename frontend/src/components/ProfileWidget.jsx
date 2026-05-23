import { useState } from 'react';
import UserService from '../services/user.service';
import '../styles/layout.css';

/**
 * Floating widget that allows users to update their personal profile.
 * Appears on the bottom right of the screen.
 */
const ProfileWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        email: '', firstName: '', lastName: '', role: '', major: ''
    });

    // Open modal and fetch current user data
    const handleOpen = async () => {
        setIsOpen(true);
        setIsLoading(true);
        try {
            const res = await UserService.getMyProfile();
            setFormData(res.data);
        } catch (error) {
            setMessage({ text: 'Error loading profile', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setMessage({ text: '', type: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await UserService.updateMyProfile(formData);
            setMessage({ text: 'Profile successfully updated!', type: 'success' });
            setTimeout(() => handleClose(), 2000); // Close automatically after success
        } catch (error) {
            setMessage({ text: 'Failed to update profile', type: 'error' });
        }
    };

    return (
        <>
            {/* FLOATING BUTTON */}
            <div className="fab-container">
                <button className="fab-button" onClick={handleOpen} title="Settings & Profile">
                    ⚙️
                </button>
            </div>

            {/* MODAL WINDOW */}
            {isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                    <div className="glass-card" style={{ width: '500px', maxWidth: '95%', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>My Profile</h3>
                            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px' }}>✖</button>
                        </div>

                        {message.text && (
                            <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center',
                                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                                color: message.type === 'success' ? '#86efac' : '#fca5a5',
                                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}>
                                {message.text}
                            </div>
                        )}

                        {isLoading ? (
                            <p style={{ textAlign: 'center' }}>Loading your data...</p>
                        ) : (
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

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                    <button type="button" onClick={handleClose} className="logout-button btn-action">Cancel</button>
                                    <button type="submit" className="auth-button btn-action">Save Changes</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileWidget;