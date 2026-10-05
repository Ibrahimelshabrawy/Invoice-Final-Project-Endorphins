import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please provide the administrative access password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(password);
      toast.success('Welcome back to Endorphins Admin.');
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-deep)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-black)',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
            }}
          >
            <img
              src="/logo.jpg"
              alt="Endorphins Art Labs"
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
            />
          </div>

          <h1
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}
          >
            endorphins
          </h1>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            Art Labs • Admin Portal
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Invoicing, billing cycles, and operational administration
          </p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-gray-850)',
              border: '1px solid var(--color-gray-600)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--color-white)',
              fontSize: '12.5px',
              marginBottom: '20px',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="admin-password">
              <span>Admin Master Key</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type="password"
                className="form-input"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                required
                style={{ paddingLeft: '38px' }}
              />
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', marginTop: '6px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authorizing...</span>
              </>
            ) : (
              <>
                <span>Access Management Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
