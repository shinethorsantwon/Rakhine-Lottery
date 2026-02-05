import React, { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || '';

// Icons
const Icons = {
    Trophy: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
    Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
    Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
    Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    EyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
};

const Auth = ({ onLogin, ticketPrice = 1000, prizes = { prize1: 0, prize2: 0, prize3: 0 } }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/api/login' : '/api/signup';
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            if (isLogin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user);
            } else {
                setLoading(false);
                setError('');
                alert('Registration successful! Please login.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
            zIndex: 9999, overflowY: 'auto', padding: '20px'
        }}>

            <div style={{
                width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px',
                animation: 'fade-in-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}>

                {/* Branding */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', margin: 0,
                        background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>Rakhine</h1>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', letterSpacing: '6px', fontWeight: '800', display: 'block' }}>LOTTERY SYSTEM</span>
                </div>

                {/* Main Card */}
                <div className="card" style={{
                    padding: '32px', borderRadius: '32px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}>

                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '4px', marginBottom: '32px' }}>
                        <button onClick={() => setIsLogin(true)} style={{
                            flex: 1, padding: '12px', border: 'none', borderRadius: '12px',
                            background: isLogin ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: isLogin ? 'white' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', transition: '0.3s'
                        }}>Login</button>
                        <button onClick={() => setIsLogin(false)} style={{
                            flex: 1, padding: '12px', border: 'none', borderRadius: '12px',
                            background: !isLogin ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: !isLogin ? 'white' : 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', transition: '0.3s'
                        }}>Register</button>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '14px', borderRadius: '16px', marginBottom: '24px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {!isLogin && (
                            <>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icons.User /></div>
                                    <input type="text" name="displayName" className="auth-input" placeholder="Full Name" value={formData.displayName} onChange={handleChange} required style={{ paddingLeft: '50px' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icons.Phone /></div>
                                    <input type="text" name="phone" className="auth-input" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required style={{ paddingLeft: '50px' }} />
                                </div>
                            </>
                        )}

                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icons.Mail /></div>
                            <input type="email" name="email" className="auth-input" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={{ paddingLeft: '50px' }} />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icons.Lock /></div>
                            <input type={showPassword ? "text" : "password"} name="password" className="auth-input" placeholder="Password" value={formData.password} onChange={handleChange} required style={{ paddingLeft: '50px', paddingRight: '50px' }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>

                        <button className="buy-btn" type="submit" disabled={loading} style={{
                            marginTop: '10px', background: 'var(--gold-gradient)', color: '#0f172a',
                            fontSize: '1.2rem', padding: '18px', borderRadius: '16px', border: 'none', fontWeight: '900',
                            boxShadow: '0 10px 20px rgba(251, 191, 36, 0.3)'
                        }}>{loading ? 'PLEASE WAIT...' : isLogin ? 'LOG IN NOW' : 'CREATE ACCOUNT'}</button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>Forgot your password?</button>
                    </div>
                </div>

                {/* Prize Info - Styled for the Centered View */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="card" style={{ padding: '16px 24px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'var(--gold-gradient)', padding: '8px', borderRadius: '12px', color: '#0f172a' }}><Icons.Trophy /></div>
                            <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--secondary)', textTransform: 'uppercase' }}>Current 1st Prize</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>{prizes.prize1?.toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>MMK</span></div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ticket Entry</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>{ticketPrice.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', opacity: 0.2, fontSize: '0.7rem', letterSpacing: '1px' }}>
                    SECURE ENCRYPTED LOTTERY SYSTEM &bull; 2026
                </div>

            </div>
        </div>
    );
};

export default Auth;
