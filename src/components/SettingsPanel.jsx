import React, { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || '';
import { useRef } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

// System Icons (Refined)
const Icons = {
    User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Lock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    Close: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Save: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
};

function SettingsPanel({ user, onBack, onLogout, onUpdate }) {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Cropper State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result));
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCroppedImage = async () => {
        setLoading(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

            const formData = new FormData();
            formData.append('profileImage', croppedImageBlob, 'profile.jpg');

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/profile/update-icon`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Icon Updated' });
                onUpdate();
                setImageSrc(null); // Close cropper
                setTimeout(() => setMessage({ type: '', text: '' }), 2500);
            } else {
                setMessage({ type: 'error', text: 'Upload failed' });
            }
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Error cropping image' });
        } finally {
            setLoading(false);
        }
    };


    const handleUpdateName = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/profile/update-display-name`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ displayName })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: 'Name Synchronized' });
                onUpdate();
                setTimeout(() => setMessage({ type: '', text: '' }), 2500);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/profile/update-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: 'Security Fortified' });
                setOldPassword('');
                setNewPassword('');
                setTimeout(() => setMessage({ type: '', text: '' }), 2500);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 1) 100%)',
            backdropFilter: 'blur(60px)',
            WebkitBackdropFilter: 'blur(60px)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            padding: 'calc(env(safe-area-inset-top) + 20px) 24px env(safe-area-inset-bottom) 24px',
            animation: 'fade-in 0.4s ease-out',
            overflowY: 'auto'
        }}>

            {/* Cropper Modal Overlay */}
            {imageSrc && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 20000, background: 'black', display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div style={{ padding: '20px', background: '#1e293b', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'white', fontSize: '0.8rem' }}>Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className="zoom-range"
                                style={{ flex: 1 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSaveCroppedImage} disabled={loading} className="buy-btn" style={{ flex: 1, background: 'var(--gold-gradient)', color: 'black' }}>
                                {loading ? 'Saving...' : 'Save Icon'}
                            </button>
                            <button onClick={() => setImageSrc(null)} disabled={loading} className="logout-btn" style={{ flex: 1 }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header: Absolute Top */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', maxWidth: '440px', margin: '0 auto 40px auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            width: '60px', height: '60px', borderRadius: '18px',
                            background: 'var(--gold-gradient)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: '#0f172a',
                            boxShadow: '0 10px 20px rgba(251, 191, 36, 0.25)',
                            cursor: 'pointer', overflow: 'hidden', position: 'relative'
                        }}>
                        {user?.profileImage ? (
                            <img src={`${API_URL}/${user.profileImage}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Icons.User />
                        )}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', fontSize: '0.6rem', color: 'white', textAlign: 'center' }}>EDIT</div>
                    </div>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>Settings</h2>
                    </div>
                </div>
                <button onClick={onBack} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    width: '48px', height: '48px', borderRadius: '16px', color: 'white', cursor: 'pointer',
                    transition: '0.3s'
                }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    <Icons.Close />
                </button>
            </div>

            {/* Immersive Centered Content (No Card) */}
            <div style={{
                width: '100%', maxWidth: '440px', margin: '0 auto',
                display: 'flex', flexDirection: 'column', gap: '32px'
            }}>

                {message.text && (
                    <div style={{
                        padding: '16px', borderRadius: '20px',
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? '#10b981' : '#ef4444',
                        textAlign: 'center', fontWeight: '900', fontSize: '0.9rem',
                        border: '1px solid currentColor', animation: 'scale-up-fade 0.3s ease'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Profile Identity Section */}
                <div style={{ animation: 'fade-in-up 0.5s ease 0.1s both' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '3px', marginBottom: '16px', opacity: 0.6 }}>IDENTITY PROTOCOL</div>
                    <form onSubmit={handleUpdateName}>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="auth-input"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="Full Name"
                                style={{
                                    height: '60px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                                    paddingLeft: '20px', paddingRight: '70px', borderRadius: '20px', fontSize: '1.05rem',
                                    color: 'white'
                                }}
                            />
                            <button type="submit" disabled={loading} style={{
                                position: 'absolute', right: '10px', top: '10px', bottom: '10px', width: '50px',
                                background: 'white', border: 'none', borderRadius: '14px',
                                color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: '0.2s', boxShadow: '0 5px 15px rgba(255,255,255,0.1)'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Icons.Save />
                            </button>
                        </div>
                    </form>
                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>@{user?.username}</span>
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                            padding: '4px 12px', borderRadius: '100px', fontSize: '0.65rem',
                            fontWeight: '900', letterSpacing: '1px'
                        }}>VERIFIED</div>
                    </div>
                </div>

                {/* Security Section */}
                <div style={{ animation: 'fade-in-up 0.5s ease 0.2s both' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '3px', marginBottom: '16px', opacity: 0.6 }}>SECURITY VAULT</div>
                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Current Password"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            style={{ height: '56px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px' }}
                        />
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="New Vault PIN"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={{ height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px' }}
                        />
                        <button type="submit" disabled={loading || !newPassword} className="buy-btn" style={{
                            height: '58px', background: 'var(--gold-gradient)', color: '#0f172a',
                            fontWeight: '900', fontSize: '0.95rem', borderRadius: '20px', border: 'none',
                            marginTop: '8px', boxShadow: '0 10px 25px rgba(251, 191, 36, 0.2)'
                        }}>AUTHORIZE CHANGE</button>
                    </form>
                </div>

                {/* Session Actions */}
                <div style={{ marginTop: '20px', animation: 'fade-in-up 0.5s ease 0.3s both' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%', padding: '20px', borderRadius: '20px',
                            background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444', fontWeight: '900', fontSize: '1rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            transition: '0.3s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <Icons.Logout /> TERMINATE SESSION
                    </button>
                </div>

                {/* Footer Info */}
                <div style={{
                    textAlign: 'center', marginTop: '20px', paddingBottom: '40px',
                    opacity: 0.2, fontSize: '0.7rem', color: 'white', fontWeight: '800',
                    letterSpacing: '2px', textTransform: 'uppercase'
                }}>
                    RAKHINE ELITE PORTAL &bull; V9.0 IMMERSIVE
                </div>

            </div>
        </div>
    );
}

export default SettingsPanel;
