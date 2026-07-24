import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { User, Mail, Shield, Sparkles, Award, Trash2, Calendar } from 'lucide-react';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('organizer');
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'organizer');
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/learning');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching learning history:', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      await updateProfile({ name, email, role });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Are you sure you want to delete this learning session?')) return;
    try {
      await api.delete(`/learning/${id}`);
      setHistory(history.filter(h => h.session_id !== id));
    } catch (err) {
      console.error('Failed to delete learning session:', err);
    }
  };

  // Compute stats
  const completedQuizzes = history.filter(h => h.score !== null);
  const averageScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / completedQuizzes.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      
      {/* Page Title */}
      <div className="mb-10">
        <h1 className="font-outfit font-extrabold text-3xl text-white">Your Profile</h1>
        <p className="text-slate-400 mt-1">Manage credentials, roles, and review training achievements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Update profile */}
        <div className="glass-panel rounded-2xl p-6 h-fit">
          <h2 className="font-outfit font-semibold text-lg text-white mb-6 flex items-center space-x-2">
            <User className="h-5 w-5 text-violet-400" />
            <span>Profile Credentials</span>
          </h2>

          {success && (
            <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 p-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-900/50 text-red-200 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Access Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="glass-input w-full bg-slate-950"
              >
                <option value="organizer">Event Organizer</option>
                <option value="vendor">Service Vendor</option>
                <option value="attendee">Attendee</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary w-full mt-4 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Columns: Stats & Learning Session log */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="bg-violet-500/10 p-3 rounded-xl text-violet-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Role Access</div>
                <div className="text-lg font-bold text-white capitalize">{user?.role}</div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Quizzes Taken</div>
                <div className="text-2xl font-extrabold text-white">{completedQuizzes.length}</div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 flex items-center space-x-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Average Score</div>
                <div className="text-2xl font-extrabold text-white">{averageScore}%</div>
              </div>
            </div>
          </div>

          {/* Learning Session Log */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-outfit font-semibold text-lg text-white mb-6 flex items-center space-x-2">
              <Award className="h-5 w-5 text-violet-400" />
              <span>Academy Training History</span>
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                <p className="text-slate-400">No training sessions completed yet.</p>
                <p className="text-xs text-slate-500 mt-1">Start a session in the Academy tab to learn & take quizzes!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.session_id} className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl hover:border-slate-700/60 transition-all">
                    <div>
                      <div className="font-medium text-white">{item.topic}</div>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(item.session_date).toLocaleDateString()}</span>
                        </span>
                        {item.score !== null ? (
                          <span className="bg-violet-950/40 text-violet-300 border border-violet-850/50 px-2 py-0.5 rounded-full font-medium">
                            Score: {item.score} / {item.total_questions}
                          </span>
                        ) : (
                          <span className="text-amber-400">Quiz pending</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSession(item.session_id)}
                      className="text-slate-500 hover:text-red-400 p-2 transition-colors rounded-lg hover:bg-slate-850"
                      title="Delete Session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default UserProfile;
