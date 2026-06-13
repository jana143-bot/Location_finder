import React from 'react';
import { MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const handleLogin = () => {
    // Redirect to backend mock OAuth flow
    window.location.href = 'http://localhost:3000/api/auth/login';
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card fade-in">
        <div className="login-header">
          <div className="icon-wrapper">
            <MapPin size={40} className="text-accent" />
          </div>
          <h1>Location Finder</h1>
          <p className="subtitle">Discover places globally with our advanced dashboard.</p>
        </div>
        
        <div className="features-list">
          <div className="feature-item">
            <ShieldCheck size={20} className="text-secondary" />
            <span>Secure OAuth Authentication</span>
          </div>
          <div className="feature-item">
            <ShieldCheck size={20} className="text-secondary" />
            <span>Rate Limiting Protection</span>
          </div>
          <div className="feature-item">
            <ShieldCheck size={20} className="text-secondary" />
            <span>Robust Error Handling</span>
          </div>
        </div>

        <button className="btn-primary login-btn mt-8" onClick={handleLogin}>
          <span>Login with Provider</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Login;
