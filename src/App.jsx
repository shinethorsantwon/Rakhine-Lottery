import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import SettingsPanel from './components/SettingsPanel';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import logo from './assets/logo.ico';



const Icons = {
  Trophy: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,
  Medal: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  Admin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path><path d="M12 11v5"></path><path d="M12 7h.01"></path></svg>,
  Ticket: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
};
const API_URL = import.meta.env.VITE_API_URL || '';

const CircularChart = ({ value, subLabel, thirdLabel, type, secondValue, commissionValue, total, displayValue }) => {
  const radius = 82;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const percentage1 = (value / total) * 100;
  const offset1 = circumference - (percentage1 / 100) * circumference;

  let offset2 = circumference;
  if (secondValue) {
    const percentage2 = (secondValue / total) * 100;
    offset2 = circumference - ((percentage1 + percentage2) / 100) * circumference;
  }

  let offset3 = circumference;
  if (commissionValue) {
    const percentage3 = (commissionValue / total) * 100;
    const combinedPercentage = (percentage1 + (secondValue || 0) / total * 100 + percentage3);
    offset3 = circumference - (combinedPercentage / 100) * circumference;
  }

  return (
    <div className="circular-container">
      <svg height={radius * 2} width={radius * 2} className="circular-svg">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle
          stroke="rgba(255,255,255,0.05)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {commissionValue > 0 && (
          <circle
            stroke="url(#goldGradient)"
            fill="transparent"
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset: offset3, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            strokeWidth={stroke}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        )}
        {secondValue > 0 && (
          <circle
            stroke="url(#greenGradient)"
            fill="transparent"
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset: offset2, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            strokeWidth={stroke}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        )}
        <circle
          stroke={type === 'prize' ? 'url(#goldGradient)' : 'url(#blueGradient)'}
          fill="transparent"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset: offset1, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="circular-content">
        <span className="circular-value" style={{ color: type === 'prize' ? 'var(--secondary)' : 'var(--primary)' }}>
          {(displayValue !== undefined ? displayValue : value).toLocaleString()}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
          <span className="circular-sublabel" style={{ color: secondValue ? 'var(--success)' : 'inherit' }}>{subLabel}</span>
          {thirdLabel && (
            <span className="circular-sublabel" style={{ color: '#fbbf24', fontSize: '0.7rem', marginTop: '2px', fontWeight: 'bold' }}>
              {thirdLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  const [userTickets, setUserTickets] = useState(0);
  const [showAuth, setShowAuth] = useState(true);
  const [balance, setBalance] = useState(0);
  const [wonBalance, setWonBalance] = useState(0);
  const [commission, setCommission] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState('deposit');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [kpayName, setKpayName] = useState('');
  const [kpayPhone, setKpayPhone] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [lastWinnerInfo, setLastWinnerInfo] = useState([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingWinner, setRollingWinner] = useState('???');
  const [proofFile, setProofFile] = useState(null);
  const [ticketPrice, setTicketPrice] = useState(1000); // Dynamic Price

  // Refs for state access in event listener
  const showAdminRef = React.useRef(showAdmin);
  const showSettingsRef = React.useRef(showSettings);
  const showBuyModalRef = React.useRef(showBuyModal);
  const showWalletModalRef = React.useRef(showWalletModal);
  const showVerifyModalRef = React.useRef(showVerifyModal);
  const showWinnerModalRef = React.useRef(showWinnerModal);
  const showSuccessModalRef = React.useRef(showSuccessModal);

  useEffect(() => {
    showAdminRef.current = showAdmin;
    showSettingsRef.current = showSettings;
    showBuyModalRef.current = showBuyModal;
    showWalletModalRef.current = showWalletModal;
    showVerifyModalRef.current = showVerifyModal;
    showWinnerModalRef.current = showWinnerModal;
    showSuccessModalRef.current = showSuccessModal;
  }, [showAdmin, showSettings, showBuyModal, showWalletModal, showVerifyModal, showWinnerModal, showSuccessModal]);

  useEffect(() => {
    let backListener;
    const setupListener = async () => {
      backListener = await CapApp.addListener('backButton', ({ canGoBack }) => {
        if (showAdminRef.current) {
          setShowAdmin(false);
        } else if (showSettingsRef.current) {
          setShowSettings(false);
        } else if (showBuyModalRef.current) {
          setShowBuyModal(false);
        } else if (showWalletModalRef.current) {
          setShowWalletModal(false);
        } else if (showVerifyModalRef.current) {
          setShowVerifyModal(false);
        } else if (showWinnerModalRef.current) {
          setShowWinnerModal(false);
        } else if (showSuccessModalRef.current) {
          setShowSuccessModal(false);
        } else {
          CapApp.exitApp();
        }
      });
    };
    setupListener();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, []);

  // Dynamic Favicon
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");
    if (!link) {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      document.head.appendChild(newLink);
    }
    const currentLink = document.querySelector("link[rel~='icon']");
    if (user?.profileImage) {
      currentLink.href = `${API_URL}/${user.profileImage}`;
    } else {
      currentLink.href = logo;
    }
  }, [user]);

  useEffect(() => {
    // Force Hide Scrollbar via JS Injection
    const style = document.createElement('style');
    style.innerHTML = `
      ::-webkit-scrollbar { display: none !important; width: 0 !important; background: transparent !important; }
      * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
    `;
    document.head.appendChild(style);

    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true });
      StatusBar.setStyle({ style: Style.Dark }); // Dark style means LIGHT text (for dark backgrounds)
    }

    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchProfile(token);
      fetchMyTickets(token);
    }
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
      const token = localStorage.getItem('token');
      if (token) fetchProfile(token);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      if (data) {
        setTotalTicketsSold(data.totalSold);
        setTicketPrice(data.ticketPrice || 1000); // Updated: Fetch price
        if (data.lastWinningTicketId && data.lastWinnerName) {
          const winners = [
            { rank: '1st', name: data.lastWinnerName, ticketId: data.lastWinningTicketId, color: '#fbbf24', icon: '👑', amount: parseFloat(data.lastWinnerPrize || 0) },
            { rank: '2nd', name: data.lastWinnerName2, ticketId: data.lastWinningTicketId2, color: '#e2e8f0', icon: '🥈', amount: parseFloat(data.lastWinnerPrize2 || 0) },
            { rank: '3rd', name: data.lastWinnerName3, ticketId: data.lastWinningTicketId3, color: '#cd7f32', icon: '🥉', amount: parseFloat(data.lastWinnerPrize3 || 0) }
          ].filter(w => w.name && w.ticketId);
          setLastWinnerInfo(winners);
          const savedLastId = localStorage.getItem('lastWinningId');
          if (savedLastId !== String(data.lastWinningTicketId)) {
            setShowWinnerModal(true);
            localStorage.setItem('lastWinningId', data.lastWinningTicketId);
            const token = localStorage.getItem('token');
            if (token) fetchMyTickets(token);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchMyTickets = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyTickets(data);
        setUserTickets(data.length);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(parseFloat(data.balance));
        setWonBalance(parseFloat(data.wonBalance || 0));
        setCommission(parseFloat(data.commissionBalance || 0));
        setUserTickets(parseInt(data.ticketsOwned || 0));
        const updatedUser = { ...JSON.parse(localStorage.getItem('user')), ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleWalletRequest = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !walletAmount) return;
    if (walletType === 'deposit' && paymentMethod === 'kbzpay') {
      setShowVerifyModal(true);
      return;
    }

    const formData = new FormData();
    formData.append('amount', walletAmount);
    formData.append('type', walletType);
    if (walletType === 'withdrawal') {
      formData.append('withdrawInfo', JSON.stringify({ name: kpayName, phone: kpayPhone }));
    }
    if (proofFile) {
      formData.append('proofImage', proofFile);
    }
    formData.append('method', paymentMethod);

    try {
      const response = await fetch(`${API_URL}/api/request-transaction`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (response.ok) {
        setWalletAmount('');
        setProofFile(null);
        setShowWalletModal(false);
        setSuccessMessage(`${walletType === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted! Waiting for Admin approval.`);
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        setSuccessMessage('Error: ' + error.message);
        setShowSuccessModal(true);
      }
    } catch (error) {
      setSuccessMessage('Request failed');
      setShowSuccessModal(true);
    }
  };

  const submitVerification = async () => {
    if (!verifyCode || verifyCode.length < 4) {
      setSuccessMessage('Please enter at least 4 digits');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/request-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(walletAmount),
          type: 'deposit',
          note: `KBZPay QR - Last 4: ${verifyCode}`,
          method: 'kbzpay'
        })
      });
      if (response.ok) {
        setSuccessMessage('Deposit Request Submitted Successfully! Admin will review it shortly.');
        setShowSuccessModal(true);
        fetchProfile(token);
        setWalletAmount('');
        setShowVerifyModal(false);
        setShowWalletModal(false);
        setVerifyCode('');
      } else {
        const data = await response.json();
        setSuccessMessage('Error: ' + data.message);
        setShowSuccessModal(true);
      }
    } catch (error) {
      setSuccessMessage('Request failed');
      setShowSuccessModal(true);
    }
  };

  const handleDrawWinner = async () => {
    // Alert removed as requested
    setIsDrawing(true);
    let interval = setInterval(() => {
      setRollingWinner(Math.floor(Math.random() * 1000));
    }, 50);
    const token = localStorage.getItem('token');
    try {
      setTimeout(async () => {
        const response = await fetch(`${API_URL}/api/admin/draw-winner`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        clearInterval(interval);
        setIsDrawing(false);
        const data = await response.json();
        if (response.ok) {
          const totalAmountForDraw = totalTicketsSold * TICKET_PRICE;
          const adminFeeForDraw = totalAmountForDraw * 0.10;
          const currentPrizePool = totalAmountForDraw - adminFeeForDraw;
          const winners = data.winners.map((w, index) => ({
            rank: index === 0 ? '1st' : (index === 1 ? '2nd' : '3rd'),
            name: w.name,
            ticketId: w.ticketId,
            color: index === 0 ? '#fbbf24' : (index === 1 ? '#e2e8f0' : '#cd7f32'),
            icon: index === 0 ? '👑' : (index === 1 ? '🥈' : '🥉'),
            amount: w.prize
          }));
          setLastWinnerInfo(winners);
          setShowWinnerModal(true);
        } else {
          setSuccessMessage(data.message);
          setShowSuccessModal(true);
        }
      }, 3000);
    } catch (e) {
      clearInterval(interval);
      setIsDrawing(false);
      setSuccessMessage('Draw failed');
      setShowSuccessModal(true);
    }
  };

  const handleBulkBuy = async () => {
    const token = localStorage.getItem('token');
    const totalCost = ticketQuantity * TICKET_PRICE;
    if ((balance + wonBalance) < totalCost) {
      setSuccessMessage('Insufficient combined balance! Please deposit to top up.');
      setShowSuccessModal(true);
      setShowBuyModal(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/buy-tickets-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity: ticketQuantity })
      });
      if (response.ok) {
        const data = await response.json();
        setTotalTicketsSold(data.totalSold);
        setBalance(parseFloat(data.balance));
        setWonBalance(parseFloat(data.wonBalance || 0));
        setUserTickets(prev => prev + ticketQuantity);
        fetchMyTickets(token);
        setShowBuyModal(false);
        setSuccessMessage(`Successfully bought ${ticketQuantity} tickets! Good luck! 🍀`);
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        setSuccessMessage(error.message);
        setShowSuccessModal(true);
      }
    } catch (error) {
      setSuccessMessage('Purchase failed');
      setShowSuccessModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setBalance(0);
    setUserTickets(0);
    setWonBalance(0);
    setShowAdmin(false);
    setShowSettings(false);
  };

  const currentTotalAmount = totalTicketsSold * ticketPrice;
  const currentAdminFee = currentTotalAmount * 0.10;
  const currentPrizePool = currentTotalAmount - currentAdminFee;
  const prize1 = currentPrizePool * 0.50;
  const prize2 = currentPrizePool * 0.30;
  const prize3 = currentPrizePool * 0.20;

  return (
    <div className="container">
      {user && (
        <header className="app-header" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: user.profileImage ? 'var(--gold-gradient)' : 'transparent',
                padding: user.profileImage ? '2px' : '0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <img
                  src={user.profileImage ? `${API_URL}/${user.profileImage}` : logo}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: user.profileImage ? '10px' : '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-1px', margin: 0, background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rakhine</h1>
                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', letterSpacing: '4px', fontWeight: '800', textTransform: 'uppercase', lineHeight: 1 }}>Lottery</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {user.role === 'admin' && (
                <>
                  <button className="settings-btn" style={{ color: 'var(--secondary)', borderColor: 'rgba(251, 191, 36, 0.3)' }} onClick={handleDrawWinner} disabled={isDrawing}>
                    {isDrawing ? <span className="animate-spin"></span> : <Icons.Trophy />}
                  </button>
                  <button className="settings-btn" style={{ color: 'var(--text-muted)' }} onClick={() => setShowAdmin(true)}><Icons.Admin /></button>
                </>
              )}
              <button className="settings-btn" onClick={() => setShowSettings(true)}><Icons.Settings /></button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'stretch',
            width: '100%'
          }}>
            <div className="card" style={{ flex: 1.8, padding: '16px', background: 'var(--gold-gradient)', color: '#020617', border: 'none', marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '800', opacity: 0.8, letterSpacing: '1px', marginBottom: '10px', textAlign: 'center' }}>Prize Pool</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Trophy />
                    <span style={{ fontWeight: '800', fontSize: '0.75rem' }}>1ST</span>
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>{prize1.toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', px: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.8 }}>2ND</span>
                  <span style={{ fontWeight: '800', fontSize: '0.75rem' }}>{prize2.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', px: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.8 }}>3RD</span>
                  <span style={{ fontWeight: '800', fontSize: '0.75rem' }}>{prize3.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ flex: 1, padding: '12px', position: 'relative', marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, textAlign: 'center', marginBottom: '8px', letterSpacing: '1px' }}>Wallet</div>
              <CircularChart
                value={balance}
                secondValue={wonBalance}
                commissionValue={commission}
                total={(balance + wonBalance + (commission || 0)) || 1}
                displayValue={balance + wonBalance + (commission || 0)}
                type="wallet"
                subLabel={wonBalance > 0 ? `+${wonBalance.toLocaleString()}` : ''}
                thirdLabel={commission > 0 ? `Fee: ${commission.toLocaleString()}` : null}
              />
            </div>
          </div>
        </header>
      )}

      {!user ? (
        <Auth
          onLogin={(userData) => {
            setUser(userData);
            setShowAuth(false);
            fetchProfile(localStorage.getItem('token'));
          }}
          ticketPrice={ticketPrice}
          prizes={{ prize1, prize2, prize3 }}
        />
      ) : (
        <>
          <div className="sticky-stack">
            <div className="card" style={{ marginBottom: '0', background: 'rgba(30, 41, 59, 0.95)', border: '1px solid var(--glass-border)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Ticket Price</p>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{ticketPrice.toLocaleString()} <span style={{ fontSize: '1rem', WebkitTextFillColor: 'var(--text-muted)' }}>MMK</span></h2>
              </div>
              <button className="buy-btn" onClick={() => user ? setShowBuyModal(true) : setShowAuth(true)} style={{ background: 'var(--gold-gradient)', color: '#0f172a', fontWeight: '800', letterSpacing: '0.5px' }}>
                {user ? 'Buy Tickets Now' : 'Join to Buy Ticket'}
              </button>
              {user && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => { setShowWalletModal(true); setWalletType('deposit'); }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: 'white', border: 'none', fontWeight: '600' }}>Deposit</button>
                  <button onClick={() => { setShowWalletModal(true); setWalletType('withdrawal'); }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: 'white', border: 'none', fontWeight: '600' }}>Withdraw</button>
                </div>
              )}
            </div>

            {/* Latest Winner Section - Refined */}
            {user && lastWinnerInfo && lastWinnerInfo.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)', border: 'none', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0, boxShadow: '0 10px 30px -5px rgba(67, 56, 202, 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%' }}>
                      <Icons.Trophy />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Latest Winner</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>{lastWinnerInfo[0]?.name}</div>
                      {lastWinnerInfo[0]?.amount && (
                        <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 'bold' }}>
                          {lastWinnerInfo[0].amount.toLocaleString()} MMK
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {user && (
            <div style={{ marginTop: '0', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                <Icons.Ticket />
                <span style={{ color: 'white', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>My Collection</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
                padding: '4px'
              }}>
                {myTickets.length > 0 ? myTickets.map(ticket => (
                  <div key={ticket.id} className="premium-ticket">
                    <div className="ticket-label">Ticket No.</div>
                    <div className="ticket-number">
                      {String(ticket.id).padStart(6, '0')}
                    </div>
                    {lastWinnerInfo?.some(w => w.ticketId === ticket.id) && (
                      <div className="winner-badge">WINNER</div>
                    )}
                    <div className="ticket-punch"></div>
                  </div>
                )) : (
                  <p style={{ gridColumn: '1 / -1', fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', padding: '20px' }}>No tickets found</p>
                )}
              </div>
            </div>
          )}



          {showSettings && (
            <SettingsPanel
              user={user}
              onBack={() => setShowSettings(false)}
              onLogout={handleLogout}
              onUpdate={() => fetchProfile(localStorage.getItem('token'))}
            />
          )}

          <footer style={{ textAlign: 'center', marginTop: 'auto', padding: '40px 0 calc(env(safe-area-inset-bottom) + 20px) 0', color: 'var(--text-muted)', fontSize: '0.75rem', opacity: 0.7 }}>
            <p>© 2026 Rakhine Lottery Service. Admin Managed Wallet System.</p>
          </footer>

          {(showWinnerModal && lastWinnerInfo && lastWinnerInfo.length > 0) || isDrawing ? (
            <div className="modal-overlay" onClick={() => !isDrawing && setShowWinnerModal(false)}>
              <div
                className="card modal-content winner-glow"
                style={{
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #0f172a 100%)',
                  color: 'white',
                  border: '4px solid #fbbf24',
                  maxWidth: '350px',
                  overflow: 'visible',
                  position: 'relative',
                  padding: '30px 20px'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', fontSize: '4rem', filter: 'drop-shadow(0 0 10px gold)' }}>
                  {isDrawing ? '🎲' : '👑'}
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', marginTop: '30px', letterSpacing: '2px', color: '#fbbf24', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {isDrawing ? 'Rolling Logic...' : 'Grand Winner!'}
                </h2>
                {isDrawing ? (
                  <div style={{ fontSize: '3.5rem', fontWeight: '900', margin: '30px 0', fontFamily: 'monospace', textShadow: '0 0 20px var(--primary)' }}>
                    RL-{String(rollingWinner).padStart(6, '0')}
                  </div>
                ) : (
                  <>
                    <div style={{ margin: '20px 0', textAlign: 'left' }}>
                      <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '16px', textAlign: 'center' }}>Congratulations to Winners!</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {lastWinnerInfo.map((winner, idx) => (
                          <div key={idx} style={{
                            background: idx === 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.1)',
                            border: idx === 0 ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: '700' }}>{winner.icon} {winner.rank} Prize</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: winner.color }}>{winner.name}</div>
                              <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: '800', marginTop: '4px' }}>
                                {winner.amount?.toLocaleString()} MMK
                              </div>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white', fontFamily: 'monospace' }}>
                              RL-{String(winner.ticketId).padStart(6, '0')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button className="buy-btn" style={{ marginTop: '24px', background: 'white', color: '#020617', boxShadow: '0 5px 15px rgba(255,255,255,0.3)' }} onClick={() => setShowWinnerModal(false)}>
                      Celebrate!
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {showAdmin && user?.role === 'admin' && (
            <div className="modal-overlay">
              <div className="card modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <AdminPanel onBack={() => setShowAdmin(false)} />
              </div>
            </div>
          )}

          {showWalletModal && (
            <div className="modal-overlay">
              <div className="card modal-content" style={{ maxWidth: '380px', background: walletType === 'deposit' ? 'var(--card-bg)' : 'linear-gradient(145deg, #0f172a, #1e293b)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {walletType === 'deposit' ? (paymentMethod === 'kbzpay' ? '📱 KBZPay Deposit' : '💰 Manual Deposit') : '🎁 Withdraw Funds'}
                </h2>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '24px', lineHeight: 1.5 }}>
                  {walletType === 'deposit' ? 'Select your preferred payment method.' : 'Withdraw winnings or balance easily.'}
                </p>
                {walletType === 'deposit' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div onClick={() => setPaymentMethod('kbzpay')} style={{ padding: '16px', borderRadius: '16px', border: paymentMethod === 'kbzpay' ? '2px solid #3b82f6' : '1px solid var(--glass-border)', background: paymentMethod === 'kbzpay' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📱</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>KBZPay</div>
                    </div>
                    <div onClick={() => setPaymentMethod('manual')} style={{ padding: '16px', borderRadius: '16px', border: paymentMethod === 'manual' ? '2px solid #fbbf24' : '1px solid var(--glass-border)', background: paymentMethod === 'manual' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💰</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Manual</div>
                    </div>
                  </div>
                )}
                {walletType === 'deposit' && paymentMethod === 'kbzpay' && (
                  <div style={{ textAlign: 'center', marginBottom: '20px', background: 'white', padding: '10px', borderRadius: '12px' }}>
                    <p style={{ color: '#333', fontSize: '0.8rem', marginBottom: '8px', fontWeight: '600' }}>Scan to Pay</p>
                    <img src="/kpay_qr.jpg" alt="KBZPay QR" style={{ width: '150px', height: '150px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    <a href="/kpay_qr.jpg" download="kpay_qr.jpg" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline', display: 'block', marginTop: '4px' }}>Download QR</a>
                  </div>
                )}

                {walletType === 'withdrawal' && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Available Balance: <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{(balance + wonBalance).toLocaleString()} MMK</span></p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>KPay Name</label>
                        <input type="text" className="auth-input" placeholder="Your Name" value={kpayName} onChange={e => setKpayName(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Phone</label>
                        <input type="number" className="auth-input" placeholder="09..." value={kpayPhone} onChange={e => setKpayPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {walletType === 'deposit' && (
                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Payment Proof (Screenshot)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="auth-input"
                      onChange={(e) => setProofFile(e.target.files[0])}
                      style={{ padding: '8px' }}
                    />
                  </div>
                )}
                <div className="input-group">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Amount (MMK)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" className="auth-input" placeholder="e.g. 5000" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} style={{ paddingRight: '80px' }} />
                    {walletType === 'withdrawal' && (
                      <button onClick={() => setWalletAmount(balance + wonBalance)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'var(--success)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '0.7rem', padding: '4px 8px' }}>MAX</button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="buy-btn" onClick={handleWalletRequest} disabled={!walletAmount || parseFloat(walletAmount) <= 0 || (walletType === 'withdrawal' && (!kpayName || !kpayPhone))} style={{ flex: 1, background: walletType === 'deposit' && paymentMethod === 'kbzpay' ? '#3b82f6' : 'var(--gold-gradient)', opacity: (!walletAmount || parseFloat(walletAmount) <= 0 || (walletType === 'withdrawal' && (!kpayName || !kpayPhone))) ? 0.5 : 1 }}>{walletType === 'deposit' ? 'Submit' : 'Confirm'}</button>
                  <button type="button" className="logout-btn" style={{ flex: 1 }} onClick={() => setShowWalletModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showBuyModal && (
            <div className="modal-overlay">
              <div className="card modal-content" style={{ maxWidth: '350px' }}>
                <h2>Select Quantity</h2>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '30px 0' }}>
                  <button className="qty-btn" onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}>-</button>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ticketQuantity}</span>
                  <button className="qty-btn" onClick={() => setTicketQuantity(ticketQuantity + 1)}>+</button>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: 'var(--secondary)' }}>{(ticketQuantity * TICKET_PRICE).toLocaleString()} MMK</h3>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="buy-btn" onClick={handleBulkBuy} style={{ flex: 1 }}>Confirm</button>
                  <button type="button" className="logout-btn" style={{ flex: 1 }} onClick={() => setShowBuyModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showVerifyModal && (
            <div className="modal-overlay">
              <div className="card modal-content" style={{ maxWidth: '320px', textAlign: 'center' }}>
                <h2>🔐 Verification</h2>
                <input type="text" maxLength="6" placeholder="Last 4 digits" className="auth-input" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} style={{ textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="buy-btn" onClick={submitVerification} style={{ flex: 1 }}>Verify</button>
                  <button className="logout-btn" onClick={() => setShowVerifyModal(false)} style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showSuccessModal && (
            <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
              <div className="card modal-content" style={{ maxWidth: '320px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: '3rem' }}>{successMessage.includes('Error') ? '⚠️' : '✅'}</div>
                <p style={{ opacity: 0.8, lineHeight: 1.5 }}>{successMessage}</p>
                <button className="buy-btn" onClick={() => setShowSuccessModal(false)} style={{ marginTop: '20px' }}>Close</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
