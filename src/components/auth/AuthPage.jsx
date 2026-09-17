import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, Cpu, Users, FileText, ArrowRight, Lock, Mail, User, Sparkles } from "lucide-react";

export default function AuthPage() {
  const { login, register, loginDemo } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.name.trim()) {
          throw new Error("Full name is required");
        }
        await register(formData.name, formData.email, formData.password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError("");
    setLoading(true);
    try {
      await loginDemo(role);
    } catch (err) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background glow elements */}
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="brand-badge">
            <Cpu size={22} className="text-indigo-400" />
            <span className="brand-badge-pill">CRDT Matrix Engine</span>
          </div>
          <h1 className="auth-title">SyncDoc</h1>
          <p className="auth-subtitle">
            Collaborative Technical Document Engine with Abstract Syntax Tree (AST) Conflict Resolution
          </p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="auth-error-banner">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Alice Walker"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="engineer@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? "Authenticating..." : isLogin ? "Sign In to Workspace" : "Create Account & Launch"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>Or test with demo engineers</span>
        </div>

        {/* Quick Demo Logins for concurrent multi-user testing */}
        <div className="demo-logins-section">
          <p className="demo-instruction">
            ⚡ Quick-login buttons for testing concurrent AST conflict resolution across multiple tabs:
          </p>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-user-btn demo-btn-alice"
              onClick={() => handleDemoLogin("alice")}
              disabled={loading}
            >
              <div className="demo-avatar-circle alice-color">AW</div>
              <div className="demo-info">
                <span className="demo-name">Alice Walker</span>
                <span className="demo-role">Engineer A (Doc Owner)</span>
              </div>
            </button>

            <button
              type="button"
              className="demo-user-btn demo-btn-bob"
              onClick={() => handleDemoLogin("bob")}
              disabled={loading}
            >
              <div className="demo-avatar-circle bob-color">BM</div>
              <div className="demo-info">
                <span className="demo-name">Bob Martinez</span>
                <span className="demo-role">Engineer B (Collaborator)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Feature badges footer */}
        <div className="auth-footer-features">
          <div className="footer-feature-item">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>AST Validation</span>
          </div>
          <div className="footer-feature-item">
            <Cpu size={14} className="text-indigo-400" />
            <span>Yjs CRDT Matrices</span>
          </div>
          <div className="footer-feature-item">
            <Users size={14} className="text-sky-400" />
            <span>Visual Block Locking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
