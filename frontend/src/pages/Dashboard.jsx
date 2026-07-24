import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Calendar, MapPin, IndianRupee, Users, 
  Copy, Archive, Trash2, Download, AlertTriangle, Play 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      setError('Failed to fetch events list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Duplicate this event and its agenda/tasks/vendors?')) return;
    try {
      const res = await api.post(`/events/${id}/duplicate`);
      alert('Event duplicated successfully!');
      fetchEvents();
    } catch (err) {
      alert('Failed to duplicate event: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleArchive = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Archive this event? (Archived events are read-only)')) return;
    try {
      await api.put(`/events/${id}/archive`);
      fetchEvents();
    } catch (err) {
      alert('Failed to archive event.');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you absolutely sure you want to delete this event? This will permanently delete all tasks, agenda, vendors, and guest details.')) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter(event => event.id !== id));
    } catch (err) {
      alert('Failed to delete event.');
    }
  };

  const handleExport = async (e, id, title) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await api.get(`/events/${id}/export`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-export.json`;
      link.click();
    } catch (err) {
      alert('Failed to export event.');
    }
  };

  // Search and filter logic
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.venue && event.venue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.objective && event.objective.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && event.status === filterStatus;
  });

  // Calculate metrics
  const totalBudget = events.reduce((acc, curr) => acc + Number(curr.budget || 0), 0);
  const activeEventsCount = events.filter(e => e.status === 'active').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white">Event Dashboard</h1>
          <p className="text-slate-400 mt-1">Hello, {user?.name}. Manage agendas, check-ins, tasks, and budgets.</p>
        </div>
        {user?.role === 'organizer' && (
          <Link 
            to="/events/new" 
            className="glass-btn-primary flex items-center justify-center space-x-2 self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </Link>
        )}
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel rounded-2xl p-6">
          <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Total Managed Events</div>
          <div className="text-3xl font-extrabold text-white mt-2">{events.length}</div>
          <div className="text-xs text-violet-400 mt-1">{activeEventsCount} Active events currently</div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Combined budget Allocation</div>
          <div className="text-3xl font-extrabold text-white mt-2">₹{totalBudget.toLocaleString()}</div>
          <div className="text-xs text-indigo-400 mt-1">Funding resource checklist active</div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">User Portal Role</div>
          <div className="text-3xl font-extrabold text-violet-400 mt-2 capitalize">{user?.role}</div>
          <div className="text-xs text-slate-500 mt-1">Accessing permissions layer</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text"
            placeholder="Search events, type, objectives or venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'active' ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilterStatus('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'archived' ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            Archived
          </button>
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            All
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-950/40 border border-red-900/50 text-red-200 p-4 rounded-xl mb-6">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm mt-4">Loading your event portfolio...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-850 glass-panel rounded-2xl">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="font-outfit font-semibold text-lg text-white">No Events Found</h3>
          <p className="text-slate-400 text-sm mt-1">Get started by creating a new AI-guided event plan.</p>
          {user?.role === 'organizer' && (
            <Link to="/events/new" className="glass-btn-primary mt-6 inline-flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create First Event</span>
            </Link>
          )}
        </div>
      ) : (
        /* Event Grid List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div 
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className="glass-card rounded-2xl p-6 cursor-pointer hover:shadow-violet-600/5 hover:-translate-y-1 hover:shadow-xl relative flex flex-col justify-between"
            >
              <div>
                {/* Event header info */}
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-violet-950/50 text-violet-300 border border-violet-900/50 text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider">
                    {event.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${event.status === 'archived' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    {event.status}
                  </span>
                </div>

                <h3 className="font-outfit font-extrabold text-xl text-white mb-2 line-clamp-1">
                  {event.title}
                </h3>
                
                <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                  {event.objective || 'No objective provided.'}
                </p>

                {/* Details list */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="line-clamp-1">{event.venue || 'TBA'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Users className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>Up to {event.capacity} guests</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <IndianRupee className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>Budget: ₹{Number(event.budget).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-auto">
                <span className="text-violet-400 hover:text-violet-300 text-xs font-semibold flex items-center space-x-1">
                  <span>Enter Planner</span>
                  <Play className="h-3 w-3" />
                </span>

                {user?.role === 'organizer' && (
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={(e) => handleDuplicate(e, event.id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {event.status === 'active' && (
                      <button 
                        onClick={(e) => handleArchive(e, event.id)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-850 rounded-lg transition-colors"
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleExport(e, event.id, event.title)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-850 rounded-lg transition-colors"
                      title="Export JSON"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, event.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-850 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
