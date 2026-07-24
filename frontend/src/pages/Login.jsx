import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, AlertTriangle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log in. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl animate-pulse-slow"></div>

        <div className="relative">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-violet-500/20 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="font-outfit font-extrabold text-2xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Log in to manage your AI event portfolios.
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 bg-red-950/40 border border-red-900/50 text-red-200 p-3 rounded-lg text-sm mb-6">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input pl-10 w-full"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pl-10 w-full"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="glass-btn-primary w-full mt-4 flex items-center justify-center space-x-2 py-3"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one now
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
