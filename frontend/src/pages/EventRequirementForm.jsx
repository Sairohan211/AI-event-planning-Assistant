import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Sparkles, Calendar, IndianRupee, Users, Shield, Plus, Trash2, ArrowLeft } from 'lucide-react';

const EventRequirementForm = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Conference');
  const [objective, setObjective] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [budget, setBudget] = useState(10000);
  const [audience, setAudience] = useState('');

  // Organizing Team State
  const [teamEmail, setTeamEmail] = useState('');
  const [teamPermission, setTeamPermission] = useState('view');
  const [teamMembers, setTeamMembers] = useState([]);

  const addTeamMember = (e) => {
    e.preventDefault();
    if (!teamEmail) return;
    if (teamMembers.some(m => m.email.toLowerCase() === teamEmail.toLowerCase())) {
      alert('Team member with this email already added.');
      return;
    }
    setTeamMembers([...teamMembers, { email: teamEmail, permission: teamPermission }]);
    setTeamEmail('');
  };

  const removeTeamMember = (email) => {
    setTeamMembers(teamMembers.filter(m => m.email !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      title,
      type,
      objective,
      date,
      venue,
      capacity: Number(capacity),
      budget: Number(budget),
      audience,
      organizing_team: teamMembers
    };

    try {
      const res = await api.post('/events', payload);
      const newEvent = res.data;
      
      // Auto-trigger Gemini plan generation after creation to provide seamless experience
      try {
        await api.post(`/ai/plan/${newEvent.id}`);
      } catch (aiErr) {
        console.warn('AI generation auto-trigger failed, organizer can generate manually.', aiErr);
      }

      navigate(`/events/${newEvent.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      
      {/* Back button */}
      <Link to="/dashboard" className="flex items-center space-x-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="mb-10">
        <h1 className="font-outfit font-extrabold text-3xl text-white">Create New Event</h1>
        <p className="text-slate-400 mt-1">Specify your event requirements. Our AI engine will map out custom run-of-show suggestions.</p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/50 text-red-200 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2 mb-10 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Step 1: Core details */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="font-outfit font-bold text-xl text-white">Step 1: Event Essence</h3>
            
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Annual Tech Summit 2026"
                className="glass-input w-full"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Event Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="glass-input w-full bg-slate-950"
                >
                  <option value="Conference">Conference / Seminar</option>
                  <option value="Wedding">Wedding / Social</option>
                  <option value="Concert">Concert / Performance</option>
                  <option value="Birthday">Birthday Party</option>
                  <option value="Corporate">Corporate Gathering</option>
                  <option value="Exhibition">Exhibition / Expo</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Target Date & Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="glass-input w-full bg-slate-950 text-slate-100"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Core Objective</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Facilitate knowledge sharing, network tech disruptors, and present the annual product roadmap..."
                rows={3}
                className="glass-input w-full resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => {
                  if (!title || !date) {
                    setError('Title and date are required.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }} 
                className="glass-btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Scale & Budget */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-outfit font-bold text-xl text-white">Step 2: Scale & Budgeting</h3>
            
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Target Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Metropolitan Convention Center"
                className="glass-input w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Seating Capacity (Guests)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Users className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="glass-input pl-10 w-full"
                    min={1}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Budget Allocation (₹)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <IndianRupee className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="glass-input pl-10 w-full"
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Target Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Venture capitalists, software developers, CTOs, and tech journalists"
                className="glass-input w-full"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="glass-btn-secondary">
                Back
              </button>
              <button 
                onClick={() => {
                  if (capacity <= 0 || budget < 0) {
                    setError('Enter valid numbers for capacity and budget.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }} 
                className="glass-btn-primary"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Team list & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-outfit font-bold text-xl text-white">Step 3: Organizing Team</h3>
            
            {/* Team add member input */}
            <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
              <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center space-x-1.5">
                <Shield className="h-4 w-4 text-violet-400" />
                <span>Invite Team Collaborator</span>
              </h4>
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] text-slate-500 mb-1 uppercase">Collaborator Email</label>
                  <input
                    type="email"
                    placeholder="teammate@company.com"
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    className="glass-input w-full text-sm"
                  />
                </div>

                <div className="w-32 flex flex-col">
                  <label className="text-[10px] text-slate-500 mb-1 uppercase">Permission</label>
                  <select
                    value={teamPermission}
                    onChange={(e) => setTeamPermission(e.target.value)}
                    className="glass-input w-full text-sm bg-slate-950"
                  >
                    <option value="view">View Only</option>
                    <option value="edit">Can Edit</option>
                  </select>
                </div>

                <button 
                  onClick={addTeamMember}
                  className="glass-btn-secondary py-2.5 px-4 flex items-center justify-center space-x-1 hover:bg-slate-900 border-violet-500/20 text-violet-400 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Invite</span>
                </button>
              </div>
            </div>

            {/* Invited list */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider block">Invited Organizers</label>
              {teamMembers.length === 0 ? (
                <div className="text-center py-6 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl text-slate-500 text-sm">
                  No co-organizers added. You will be the sole event manager.
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {teamMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3 bg-slate-950/50 border border-slate-900 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-violet-400"></div>
                        <span className="text-sm text-slate-200 font-medium">{member.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="bg-slate-900 border border-slate-850 text-slate-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                          {member.permission}
                        </span>
                        <button 
                          onClick={() => removeTeamMember(member.email)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-850">
              <button onClick={() => setStep(2)} className="glass-btn-secondary">
                Back
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="glass-btn-primary flex items-center space-x-2 py-3 px-6"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Launch Event Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default EventRequirementForm;
