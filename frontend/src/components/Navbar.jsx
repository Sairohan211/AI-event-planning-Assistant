import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, BookOpen, Clock, User, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-outfit font-extrabold text-xl tracking-tight bg-gradient-to-r from-violet-400 to-indigo-200 bg-clip-text text-transparent">
            AuraPlan
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-violet-400' : 'text-slate-300 hover:text-white'}`}
              >
                <Calendar className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/academy" 
                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${isActive('/academy') ? 'text-violet-400' : 'text-slate-300 hover:text-white'}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Academy</span>
              </Link>
              <Link 
                to="/history" 
                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${isActive('/history') ? 'text-violet-400' : 'text-slate-300 hover:text-white'}`}
              >
                <Clock className="h-4 w-4" />
                <span>History</span>
              </Link>
              <Link 
                to="/profile" 
                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors ${isActive('/profile') ? 'text-violet-400' : 'text-slate-300 hover:text-white'}`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="glass-btn-primary py-2 px-4 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-slate-800 max-w-7xl mx-auto flex flex-col space-y-4">
          {user ? (
            <>
              <Link 
                to="/dashboard" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 text-sm font-medium py-2 ${isActive('/dashboard') ? 'text-violet-400' : 'text-slate-300'}`}
              >
                <Calendar className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/academy" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 text-sm font-medium py-2 ${isActive('/academy') ? 'text-violet-400' : 'text-slate-300'}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Academy</span>
              </Link>
              <Link 
                to="/history" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 text-sm font-medium py-2 ${isActive('/history') ? 'text-violet-400' : 'text-slate-300'}`}
              >
                <Clock className="h-4 w-4" />
                <span>History</span>
              </Link>
              <Link 
                to="/profile" 
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 text-sm font-medium py-2 ${isActive('/profile') ? 'text-violet-400' : 'text-slate-300'}`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <button 
                onClick={() => { setIsOpen(false); handleLogout(); }}
                className="flex items-center space-x-2 text-sm font-medium text-slate-400 hover:text-red-400 py-2 text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col space-y-3 pt-2">
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-slate-300 text-center py-2 border border-slate-800 rounded-lg"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                onClick={() => setIsOpen(false)}
                className="glass-btn-primary py-2.5 text-center text-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
