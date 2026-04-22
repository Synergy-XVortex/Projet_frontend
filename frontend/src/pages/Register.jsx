import { useState } from 'react';
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
    
    const navigate = useNavigate();

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
            // Navigate to login page upon successful registration
            navigate('/login');
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
            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join the Academic Platform today.</p>
                
                {errorMessage && <div className="auth-error">{errorMessage}</div>}
                
                <form onSubmit={handleRegister}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                        <div style={{ flex: 1, textAlign: 'left' }}>
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
                        <div style={{ flex: 1, textAlign: 'left' }}>
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
                        <label className="auth-label">Password</label>
                        <input 
                            type="password" 
                            className="auth-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <label className="auth-label">Major</label>
                            <input 
                                type="text" 
                                className="auth-input"
                                placeholder="Software Eng. (Optional)"
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                /* Removed the "required" attribute here */
                            />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
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
                    
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>Sign In here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;