import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import '../styles/auth.css';

/**
 * Registration component for new users.
 */
const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [major, setMajor] = useState('');
    const [role, setRole] = useState('STUDENT');
    
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // --- NEW STATE FOR SUCCESS POPUP ---
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const navigate = useNavigate();

    // Ensure the login/register pages stay in dark theme
    useEffect(() => {
        document.body.classList.remove('light-theme');
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        const userData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            // Send empty string or null if major is not provided
            major: major || null, 
            role: role
        };

        try {
            await AuthService.register(userData);
            
            // Show the success popup
            setShowSuccessModal(true);
            
            // Automatically redirect to login after 4 seconds
            setTimeout(() => {
                navigate('/login');
            }, 4000);
            
        } catch (error) {
            if (error.response && error.response.status === 409) {
                setErrorMessage('This email is already in use.');
            } else {
                setErrorMessage('Registration failed. Check the provided data.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* --- SUCCESS MODAL --- */}
            {showSuccessModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                    <div className="auth-card" style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease', borderLeft: '4px solid #10b981' }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
                        <h2 style={{ color: '#10b981', margin: '0 0 15px 0' }}>Registration Successful!</h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', marginBottom: '20px' }}>
                            Your account has been successfully created. However, it requires <strong>Administrator activation</strong> before you can log in.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '15px' }}>Redirecting to login page...</p>
                    </div>
                </div>
            )}

            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join the Academic Platform today.</p>
                
                {errorMessage && <div className="auth-error">{errorMessage}</div>}
                
                <form onSubmit={handleRegister}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>
                            <label className="auth-label">First Name</label>
                            <input 
                                type="text" 
                                className="auth-input"
                                placeholder="John"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>
                            <label className="auth-label">Last Name</label>
                            <input 
                                type="text" 
                                className="auth-input"
                                placeholder="Doe"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Email Address</label>
                        <input 
                            type="email" 
                            className="auth-input"
                            placeholder="name@university.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-label">Password (Min: 8 characters)</label>
                        <input 
                            type="password" 
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>
                            <label className="auth-label">Major</label>
                            <input 
                                type="text" 
                                className="auth-input"
                                placeholder="Software Eng. (Optional)"
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>
                            <label className="auth-label">Role</label>
                            <select 
                                className="auth-input" 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)}
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="STUDENT">Student</option>
                                <option value="TEACHER">Teacher</option>
                                <option value="GUEST">Guest</option>
                                <option value="ADMINISTRATOR">Admin</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" className="auth-button" disabled={isLoading || showSuccessModal}>
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>Sign In here</Link>
                </p>
            </div>
            
            {/* Quick spinner animation specifically for this modal */}
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Register;