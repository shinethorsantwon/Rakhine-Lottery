import React, { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || '';

function AdminPanel({ onBack }) {
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('transactions');
    const [loading, setLoading] = useState(true);

    // Approval Modal State
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [adjustedAmount, setAdjustedAmount] = useState('');
    const [adminCommission, setAdminCommission] = useState(0);
    const [autoDrawDays, setAutoDrawDays] = useState(0);
    const [ticketPrice, setTicketPrice] = useState(1000); // Admin editable price
    const [editPrice, setEditPrice] = useState(''); // For input field
    const [notification, setNotification] = useState(null); // { message, type: 'success' | 'error' }

    const showNotification = (msg, type = 'success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [usersRes, txRes, profileRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/api/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (txRes.ok) setTransactions(await txRes.json());
            if (profileRes.ok) {
                const data = await profileRes.json();
                setAdminCommission(parseFloat(data.commissionBalance || 0));
            }
            if (statsRes.ok) {
                const sData = await statsRes.json();

                setAutoDrawDays(sData.autoDrawDays || 0);
                setTicketPrice(sData.ticketPrice || 1000);
                setEditPrice(sData.ticketPrice || 1000);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        }
        setLoading(false);
    };

    const handleAction = async (txId, action) => {
        if (action === 'approved') {
            const tx = transactions.find(t => t.id === txId);
            if (tx) {
                setSelectedTx(tx);
                setAdjustedAmount(tx.amount);
                setShowApproveModal(true);
            }
            return;
        }

        // For rejection, proceed directly
        submitAction(txId, action);
    };

    const submitAction = async (txId, action, finalAmount = null) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/admin/action-transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ txId, action, adjustedAmount: finalAmount })
            });

            if (response.ok) {
                fetchData();
                setShowApproveModal(false);
                setSelectedTx(null);
            }
        } catch (error) {
            console.error('Action failed', error);
        }
    };

    const confirmApproval = () => {
        if (!selectedTx) return;
        submitAction(selectedTx.id, 'approved', adjustedAmount);
    };

    const handleDeleteTransaction = async (txId) => {
        if (!window.confirm('Are you sure you want to DELETE this record permanently?')) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/admin/transaction/${txId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setTransactions(prev => prev.filter(t => t.id !== txId));
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleAdjustBalance = async (userId) => {
        const amount = prompt('Enter amount to adjust:');
        if (!amount || isNaN(amount)) return;

        const type = window.confirm('Click OK to ADD, Cancel to SUBTRACT') ? 'add' : 'subtract';
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/api/admin/adjust-balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, amount: parseFloat(amount), type })
            });

            if (response.ok) {
                showNotification('Balance adjusted successfully!');
                fetchData();
            }
        } catch (error) {
            console.error('Adjustment failed');
        }
    };

    if (loading) return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading Command Center...</div>;

    const pendingCount = transactions.filter(t => t.status === 'pending').length;

    return (
        <div className="admin-view" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🛡️ Admin Panel
                    </h2>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginLeft: '4px' }}>System Command Center</p>
                </div>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text)',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}
                >
                    Exit
                </button>
            </header>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>Active Users</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{users.length}</div>
                </div>
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>Pending Requests</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: pendingCount > 0 ? 'var(--secondary)' : 'inherit' }}>{pendingCount}</div>
                </div>

                {/* Auto Draw & Ticket Price */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
                    {/* Auto Draw Card */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>🤖 Auto Draw Settings</div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {[1, 3, 7, 30].map(days => (
                                <button
                                    key={days}
                                    onClick={async () => {
                                        await fetch(`${API_URL}/api/admin/auto-draw-settings`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                            body: JSON.stringify({ days })
                                        });
                                        setAutoDrawDays(days);
                                        showNotification(`Auto Draw set to every ${days} days!`);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '8px 4px',
                                        borderRadius: '8px',
                                        border: autoDrawDays === days ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                                        background: autoDrawDays === days ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                                        color: autoDrawDays === days ? '#fbbf24' : 'var(--text-muted)',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {days}d
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket Price Settings */}
                    <div style={{ flex: 1, background: 'rgba(52, 211, 153, 0.1)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700', color: '#34d399' }}>🎫 Ticket Price (MMK)</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                style={{
                                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', padding: '8px', borderRadius: '8px', width: '80px', fontWeight: 'bold'
                                }}
                            />
                            <button
                                onClick={async () => {
                                    if (!editPrice || editPrice <= 0) return showNotification('Invalid Price', 'error');
                                    const res = await fetch(`${API_URL}/api/admin/update-ticket-price`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                        body: JSON.stringify({ price: parseInt(editPrice) })
                                    });
                                    if (res.ok) {
                                        setTicketPrice(parseInt(editPrice));
                                        showNotification('Price updated!', 'success');
                                    } else {
                                        showNotification('Update failed', 'error');
                                    }
                                }}
                                style={{
                                    background: '#34d399', color: '#064e3b', fontWeight: 'bold',
                                    border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', flex: 1
                                }}
                            >
                                Set
                            </button>
                        </div>
                    </div>
                </div>

                {/* Commission Card (Full Width) */}
                <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#fbbf24', opacity: 0.8, fontWeight: '700' }}>Available Fees</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>{adminCommission.toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>MMK</span></div>
                    </div>
                    <button onClick={async () => {
                        const res = await fetch(`${API_URL}/api/admin/claim-commission`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        });
                        const data = await res.json();
                        if (res.ok) {
                            setAdminCommission(0);
                            fetchData();
                        }
                        showNotification(data.message, res.ok ? 'success' : 'error');
                    }} style={{ background: '#fbbf24', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)' }}>
                        Claim to Wallet
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                <button
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'transactions' ? 'var(--secondary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'transactions' ? '2px solid var(--secondary)' : 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transactions
                </button>
                <button
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        border: 'none',
                        color: activeTab === 'users' ? 'var(--secondary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'users' ? '2px solid var(--secondary)' : 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
            </div>

            {/* Content Area */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                {activeTab === 'transactions' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {transactions.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No records found.</p>}

                        {transactions.map(tx => (
                            <div key={tx.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '16px',
                                borderRadius: '16px',
                                borderLeft: `4px solid ${tx.status === 'pending' ? 'var(--secondary)' : tx.status === 'approved' ? 'var(--success)' : '#ef4444'}`
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{tx.displayName}</span>
                                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{(tx.type || 'unknown').toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '2px' }}>{parseFloat(tx.amount).toLocaleString()} <span style={{ fontSize: '0.8rem' }}>MMK</span></div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(tx.createdAt).toLocaleString()}</div>
                                    {tx.proofImage && (
                                        <a
                                            href={`${API_URL}/uploads/${tx.proofImage.replace(/\\/g, '/').split('/uploads/')[1] || tx.proofImage.split('uploads')[1] || tx.proofImage}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                fontSize: '0.8rem',
                                                color: '#fbbf24',
                                                textDecoration: 'none',
                                                marginTop: '8px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: 'rgba(251, 191, 36, 0.1)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(251, 191, 36, 0.3)'
                                            }}
                                        >
                                            📷 View Proof
                                        </a>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
                                    {tx.status === 'pending' ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleAction(tx.id, 'approved')} style={{ background: 'var(--success)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</button>
                                            <button onClick={() => handleAction(tx.id, 'rejected')} style={{ background: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>❌</button>
                                        </div>
                                    ) : (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            color: tx.status === 'approved' ? 'var(--success)' : '#ef4444',
                                            textTransform: 'uppercase',
                                            border: `1px solid ${tx.status === 'approved' ? 'var(--success)' : '#ef4444'}`,
                                            padding: '4px 8px',
                                            borderRadius: '6px'
                                        }}>
                                            {tx.status}
                                        </span>
                                    )}

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDeleteTransaction(tx.id)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            padding: '4px',
                                            opacity: 0.5,
                                            transition: 'opacity 0.2s'
                                        }}
                                        title="Delete Record"
                                        onMouseEnter={e => e.target.style.opacity = 1}
                                        onMouseLeave={e => e.target.style.opacity = 0.5}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {users.map(u => (
                            <div key={u.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'var(--gold-gradient)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}>
                                        {u.profileImage ? (
                                            <img src={`${API_URL}/${u.profileImage}`} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '1.5rem' }}>👤</span>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {u.displayName}
                                            {u.role === 'admin' && <span title="Admin">👑</span>}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '8px' }}>@{u.username} • Tickets: {u.ticketsOwned}</div>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--primary)' }}>Main: <b>{parseFloat(u.balance).toLocaleString()}</b></span>
                                            <span style={{ color: 'var(--success)' }}>Won: <b>{parseFloat(u.wonBalance || 0).toLocaleString()}</b></span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAdjustBalance(u.id)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Adjust Balance"
                                >
                                    ⚖️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {showApproveModal && selectedTx && (
                <div className="modal-overlay">
                    <div className="card modal-content" style={{ maxWidth: '350px' }}>
                        <h3 style={{ marginBottom: '16px' }}>✅ Approve Transaction</h3>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                            <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ opacity: 0.6 }}>User:</span>
                                <b>{selectedTx.displayName}</b>
                            </p>
                            <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.6 }}>Requested:</span>
                                <b>{parseFloat(selectedTx.amount).toLocaleString()} MMK</b>
                            </p>
                            {selectedTx.note && (
                                <p style={{ marginTop: '8px', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--secondary)' }}>
                                    "{selectedTx.note}"
                                </p>
                            )}
                            {selectedTx.proofImage && (
                                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '6px' }}>Payment Proof:</div>
                                    <img
                                        src={`${API_URL}/uploads/${selectedTx.proofImage.replace(/\\/g, '/').split('/uploads/')[1] || selectedTx.proofImage.split('uploads')[1] || selectedTx.proofImage}`}
                                        alt="Proof"
                                        style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', marginTop: '8px' }}
                                    />
                                </div>
                            )}
                        </div>

                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 'bold' }}>Confirm Amount (MMK)</label>
                        <input
                            type="number"
                            className="auth-input"
                            value={adjustedAmount}
                            onChange={(e) => setAdjustedAmount(e.target.value)}
                            style={{ marginBottom: '20px' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={confirmApproval}
                                className="buy-btn"
                                style={{ background: 'var(--success)', padding: '12px' }}
                            >
                                Confirm & Approve
                            </button>
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="buy-btn"
                                style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text)' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: notification.type === 'error' ? '#ef4444' : '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    zIndex: 2000,
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    animation: 'fade-in-up 0.3s ease-out'
                }}>
                    {notification.message}
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
