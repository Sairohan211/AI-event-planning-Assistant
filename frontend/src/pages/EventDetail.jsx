import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, Calendar, MapPin, Users, DollarSign, Clock, Shield, CheckSquare, 
  Truck, Clipboard, UserCheck, AlertTriangle, ArrowLeft, Plus, Check, Play, Edit, 
  Trash2, X, AlertCircle, RefreshCw, Send, CheckCircle2, Circle
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis } from 'recharts';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('ai');

  // Core Event details state
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab 1: AI Planner state
  const [aiPlan, setAiPlan] = useState(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editedConcept, setEditedConcept] = useState('');
  const [editedTimeline, setEditedTimeline] = useState([]);
  const [editedBudgetAlloc, setEditedBudgetAlloc] = useState([]);
  const [editedVendorMessages, setEditedVendorMessages] = useState([]);
  const [editedGuestMessages, setEditedGuestMessages] = useState({ invitation: '', reminder: '' });
  const [editedRisks, setEditedRisks] = useState([]);

  // Tab 2: Agenda state
  const [agenda, setAgenda] = useState([]);
  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaDesc, setAgendaDesc] = useState('');
  const [agendaStart, setAgendaStart] = useState('');
  const [agendaEnd, setAgendaEnd] = useState('');
  const [agendaSpeaker, setAgendaSpeaker] = useState('');

  // Tab 3: Tasks state
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskDependency, setTaskDependency] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  // Tab 4: Vendors state
  const [vendors, setVendors] = useState([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Catering');
  const [vendorQuote, setVendorQuote] = useState(0);
  const [vendorEmail, setVendorEmail] = useState('');

  // Tab 5: Logistics state
  const [logistics, setLogistics] = useState(null);
  const [seatingLayout, setSeatingLayout] = useState('');
  const [roomSetup, setRoomSetup] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);
  const [staffingList, setStaffingList] = useState([]);
  const [savingLogistics, setSavingLogistics] = useState(false);

  // Tab 6: Attendees state
  const [attendees, setAttendees] = useState([]);
  const [showAddAttendee, setShowAddAttendee] = useState(false);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeeDiet, setAttendeeDiet] = useState('');

  // Check editing permissions
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Event
      const eventRes = await api.get(`/events/${id}`);
      setEvent(eventRes.data);

      // Verify edit permission
      let permission = eventRes.data.owner_id === user.id;
      if (!permission) {
        try {
          const team = JSON.parse(eventRes.data.organizing_team || '[]');
          const member = team.find(m => m.email.toLowerCase() === user.email.toLowerCase());
          if (member && member.permission === 'edit') {
            permission = true;
          }
        } catch (e) {
          permission = false;
        }
      }
      setCanEdit(permission);

      // 2. Fetch associated records in parallel
      const [agendaRes, tasksRes, vendorsRes, attendeesRes, logisticsRes, aiRes] = await Promise.allSettled([
        api.get(`/events/${id}/agenda`),
        api.get(`/events/${id}/tasks`),
        api.get(`/events/${id}/vendors`),
        api.get(`/events/${id}/attendees`),
        api.get(`/events/${id}/logistics`),
        api.get(`/ai/plan/${id}`)
      ]);

      if (agendaRes.status === 'fulfilled') setAgenda(agendaRes.value.data);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data);
      if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.data);
      if (attendeesRes.status === 'fulfilled') setAttendees(attendeesRes.value.data);
      
      if (logisticsRes.status === 'fulfilled') {
        setLogistics(logisticsRes.value.data);
        setSeatingLayout(logisticsRes.value.data.seating_layout || '');
        setRoomSetup(logisticsRes.value.data.room_setup || '');
        setEquipmentList(logisticsRes.value.data.equipment || []);
        setStaffingList(logisticsRes.value.data.staffing || []);
      }

      if (aiRes.status === 'fulfilled') {
        const plan = aiRes.value.data;
        setAiPlan(plan);
        // Load default edits
        setEditedConcept(plan.concept || '');
        setEditedTimeline(plan.timeline || []);
        setEditedBudgetAlloc(plan.budget_allocation || []);
        setEditedVendorMessages(plan.vendor_messages || []);
        setEditedGuestMessages(plan.guest_messages || { invitation: '', reminder: '' });
        setEditedRisks(plan.risks_contingencies || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load event details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Tab 1: AI Planner functions ---
  const handleGenerateAIPlan = async () => {
    setAiPlanLoading(true);
    try {
      const res = await api.post(`/ai/plan/${id}`);
      const plan = res.data;
      setAiPlan(plan);
      setEditedConcept(plan.concept || '');
      setEditedTimeline(plan.timeline || []);
      setEditedBudgetAlloc(plan.budget_allocation || []);
      setEditedVendorMessages(plan.vendor_messages || []);
      setEditedGuestMessages(plan.guest_messages || { invitation: '', reminder: '' });
      setEditedRisks(plan.risks_contingencies || []);
      setEditingPlan(false);
      alert('Event plan generated by Gemini!');
    } catch (err) {
      alert('Failed to generate plan: ' + (err.response?.data?.error || err.message));
    } finally {
      setAiPlanLoading(false);
    }
  };

  const saveEditedPlan = async (isApproved = false) => {
    try {
      const payload = {
        concept: editedConcept,
        timeline: editedTimeline,
        budget_allocation: editedBudgetAlloc,
        vendor_messages: editedVendorMessages,
        guest_messages: editedGuestMessages,
        risks_contingencies: editedRisks,
        approved: isApproved
      };
      await api.put(`/ai/plan/${id}`, payload);
      setAiPlan({ ...aiPlan, ...payload });
      setEditingPlan(false);
      alert(isApproved ? 'Event plan approved!' : 'Event plan saved successfully.');
    } catch (err) {
      alert('Failed to save plan changes.');
    }
  };

  // --- Tab 2: Agenda functions ---
  const handleAddAgenda = async (e) => {
    e.preventDefault();
    if (!agendaTitle || !agendaStart || !agendaEnd) return;
    try {
      const res = await api.post(`/events/${id}/agenda`, {
        title: agendaTitle,
        description: agendaDesc,
        start_time: agendaStart,
        end_time: agendaEnd,
        speaker: agendaSpeaker
      });
      setAgenda([...agenda, res.data].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      setShowAddAgenda(false);
      // Reset inputs
      setAgendaTitle('');
      setAgendaDesc('');
      setAgendaStart('');
      setAgendaEnd('');
      setAgendaSpeaker('');
    } catch (err) {
      alert('Failed to add agenda session.');
    }
  };

  const handleDeleteAgenda = async (sessionId) => {
    if (!window.confirm('Delete this agenda session?')) return;
    try {
      await api.delete(`/agenda/${sessionId}`);
      setAgenda(agenda.filter(s => s.id !== sessionId));
    } catch (err) {
      alert('Failed to delete session.');
    }
  };

  // --- Tab 3: Tasks functions ---
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    try {
      const res = await api.post(`/events/${id}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        assignee_id: taskAssignee || null,
        status: 'todo',
        dependency_id: taskDependency || null,
        deadline: taskDeadline || null,
        blocker: '',
        approval_status: 'pending'
      });
      setTasks([...tasks, res.data]);
      setShowAddTask(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskDeadline('');
      setTaskDependency('');
    } catch (err) {
      alert('Failed to add task.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      alert('Failed to update task.');
    }
  };

  const handleUpdateTaskBlocker = async (taskId, blockerText) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { 
        blocker: blockerText,
        status: blockerText ? 'blocked' : 'todo'
      });
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      alert('Failed to save task blocker.');
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { approval_status: 'approved' });
      setTasks(tasks.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      alert('Failed to approve task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert('Failed to delete task.');
    }
  };

  // --- Tab 4: Vendors functions ---
  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!vendorName || !vendorCategory) return;
    try {
      const res = await api.post(`/events/${id}/vendors`, {
        name: vendorName,
        category: vendorCategory,
        quotation: Number(vendorQuote),
        payment_status: 'unpaid',
        contact_email: vendorEmail,
        status: 'pending'
      });
      setVendors([...vendors, res.data]);
      setShowAddVendor(false);
      setVendorName('');
      setVendorQuote(0);
      setVendorEmail('');
    } catch (err) {
      alert('Failed to add vendor.');
    }
  };

  const handleUpdateVendorStatus = async (vendorId, status) => {
    try {
      const res = await api.put(`/vendors/${vendorId}`, { status });
      setVendors(vendors.map(v => v.id === vendorId ? res.data : v));
    } catch (err) {
      alert('Failed to update vendor status.');
    }
  };

  const handleUpdateVendorPayment = async (vendorId, payment_status) => {
    try {
      const res = await api.put(`/vendors/${vendorId}`, { payment_status });
      setVendors(vendors.map(v => v.id === vendorId ? res.data : v));
    } catch (err) {
      alert('Failed to update vendor payment.');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Delete this vendor bid?')) return;
    try {
      await api.delete(`/vendors/${vendorId}`);
      setVendors(vendors.filter(v => v.id !== vendorId));
    } catch (err) {
      alert('Failed to delete vendor.');
    }
  };

  // --- Tab 5: Logistics functions ---
  const handleSaveLogistics = async () => {
    setSavingLogistics(true);
    try {
      const res = await api.post(`/events/${id}/logistics`, {
        seating_layout: seatingLayout,
        room_setup: roomSetup,
        equipment: equipmentList,
        staffing: staffingList
      });
      setLogistics(res.data);
      alert('Logistics plan saved successfully!');
    } catch (err) {
      alert('Failed to save logistics details.');
    } finally {
      setSavingLogistics(false);
    }
  };

  const addEquipment = () => {
    setEquipmentList([...equipmentList, { name: '', quantity: 1, status: 'needed' }]);
  };

  const updateEquipment = (index, field, value) => {
    const list = [...equipmentList];
    list[index][field] = value;
    setEquipmentList(list);
  };

  const removeEquipment = (index) => {
    setEquipmentList(equipmentList.filter((_, idx) => idx !== index));
  };

  const addStaff = () => {
    setStaffingList([...staffingList, { role: '', count: 1, assigned: '' }]);
  };

  const updateStaff = (index, field, value) => {
    const list = [...staffingList];
    list[index][field] = value;
    setStaffingList(list);
  };

  const removeStaff = (index) => {
    setStaffingList(staffingList.filter((_, idx) => idx !== index));
  };

  // --- Tab 6: Attendees functions ---
  const handleAddAttendee = async (e) => {
    e.preventDefault();
    if (!attendeeName || !attendeeEmail) return;
    try {
      const res = await api.post(`/events/${id}/attendees`, {
        name: attendeeName,
        email: attendeeEmail,
        dietary_needs: attendeeDiet,
        invitation_status: 'sent',
        check_in_status: false
      });
      setAttendees([...attendees, res.data]);
      setShowAddAttendee(false);
      setAttendeeName('');
      setAttendeeEmail('');
      setAttendeeDiet('');
    } catch (err) {
      alert('Failed to add attendee.');
    }
  };

  const handleToggleCheckIn = async (attendeeId, currentCheckIn) => {
    try {
      const res = await api.put(`/attendees/${attendeeId}`, { check_in_status: !currentCheckIn });
      setAttendees(attendees.map(a => a.id === attendeeId ? res.data : a));
    } catch (err) {
      alert('Failed to toggle guest check-in.');
    }
  };

  const handleUpdateRsvp = async (attendeeId, status) => {
    try {
      const res = await api.put(`/attendees/${attendeeId}`, { invitation_status: status });
      setAttendees(attendees.map(a => a.id === attendeeId ? res.data : a));
    } catch (err) {
      alert('Failed to update guest RSVP.');
    }
  };

  const handleDeleteAttendee = async (attendeeId) => {
    if (!window.confirm('Remove guest from invitation list?')) return;
    try {
      await api.delete(`/attendees/${attendeeId}`);
      setAttendees(attendees.filter(a => a.id !== attendeeId));
    } catch (err) {
      alert('Failed to delete guest.');
    }
  };

  // --- Calculations for Budget Charts ---
  const COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#6366f1'];
  
  // Total quotation from approved vendors
  const totalApprovedQuotes = vendors
    .filter(v => v.status === 'approved')
    .reduce((acc, curr) => acc + Number(curr.quotation || 0), 0);

  // Render Loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="h-10 w-10 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm mt-4">Synthesizing plan components...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Error</h2>
        <p className="text-slate-400">{error || 'Event was not found or permissions are restricted.'}</p>
        <Link to="/dashboard" className="glass-btn-primary mt-6 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* Event Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 pb-6 border-b border-slate-850 gap-4">
        <div>
          <Link to="/dashboard" className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
            <span className="bg-violet-950/60 text-violet-300 border border-violet-900/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {event.type}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${event.status === 'archived' ? 'bg-slate-850 text-slate-400' : 'bg-emerald-950 text-emerald-400 border border-emerald-900/20'}`}>
              {event.status === 'archived' ? 'Archived (Read-Only)' : 'Active Plan'}
            </span>
          </div>
          <h1 className="font-outfit font-extrabold text-3xl text-white">{event.title}</h1>
        </div>

        {/* Quick event specs */}
        <div className="flex flex-wrap items-center gap-6 bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-slate-300">
          <div className="flex items-center space-x-2 text-xs">
            <Calendar className="h-4.5 w-4.5 text-violet-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Date & Time</div>
              <div className="font-medium text-slate-200">{new Date(event.date).toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <MapPin className="h-4.5 w-4.5 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Venue</div>
              <div className="font-medium text-slate-200">{event.venue || 'TBA'}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Budget Goal</div>
              <div className="font-medium text-slate-200">${Number(event.budget).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex items-center space-x-1 overflow-x-auto border-b border-slate-850 mb-8 py-1 scrollbar-none">
        {[
          { id: 'ai', label: 'AI Planner & Briefs', icon: Sparkles },
          { id: 'agenda', label: 'Run of Show', icon: Clock },
          { id: 'tasks', label: 'Task List', icon: CheckSquare },
          { id: 'logistics', label: 'Seating & Logistics', icon: Clipboard },
          { id: 'vendors', label: 'Vendors & Budget', icon: Truck },
          { id: 'attendees', label: 'Guests Check-in', icon: UserCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-900/30'}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="space-y-6">
        
        {/* ================= TAB 1: AI PLANNER ================= */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Concept and Timeline drafts */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Concept briefing */}
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-outfit font-bold text-lg text-white flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                    <span>Gemini Event Concept Brief</span>
                  </h3>
                  {aiPlan && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${aiPlan.approved ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/20' : 'bg-amber-950 text-amber-400 border border-amber-900/20'}`}>
                      {aiPlan.approved ? 'Approved by Organizer' : 'Awaiting Review'}
                    </span>
                  )}
                </div>

                {!aiPlan ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No AI plan has been drafted for this event yet.</p>
                    {canEdit && (
                      <button 
                        onClick={handleGenerateAIPlan}
                        disabled={aiPlanLoading}
                        className="glass-btn-primary mt-4 inline-flex items-center space-x-2"
                      >
                        {aiPlanLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        <span>Draft Plan with Gemini</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {editingPlan ? (
                      <textarea
                        value={editedConcept}
                        onChange={(e) => setEditedConcept(e.target.value)}
                        rows={6}
                        className="glass-input w-full resize-none text-sm leading-relaxed"
                      />
                    ) : (
                      <p className="text-slate-350 text-sm leading-relaxed whitespace-pre-line bg-slate-950/20 border border-slate-900 p-4 rounded-xl">
                        {aiPlan.concept}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Run of show / Timelines draft */}
              {aiPlan && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="font-outfit font-bold text-lg text-white mb-4">AI Timeline Draft</h3>
                  <div className="space-y-4">
                    {editingPlan ? (
                      <div className="space-y-3">
                        {editedTimeline.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              value={item.time} 
                              onChange={(e) => {
                                const list = [...editedTimeline];
                                list[idx].time = e.target.value;
                                setEditedTimeline(list);
                              }} 
                              className="glass-input text-xs w-24 py-1"
                            />
                            <input 
                              type="text" 
                              value={item.activity} 
                              onChange={(e) => {
                                const list = [...editedTimeline];
                                list[idx].activity = e.target.value;
                                setEditedTimeline(list);
                              }} 
                              className="glass-input text-xs flex-1 py-1"
                            />
                            <input 
                              type="text" 
                              value={item.responsible} 
                              onChange={(e) => {
                                const list = [...editedTimeline];
                                list[idx].responsible = e.target.value;
                                setEditedTimeline(list);
                              }} 
                              className="glass-input text-xs w-28 py-1"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-900 bg-slate-950/20">
                        {editedTimeline.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-violet-400 bg-violet-950/50 border border-violet-900/30 px-2 py-0.5 rounded">
                                {item.time}
                              </span>
                              <span className="text-slate-200">{item.activity}</span>
                            </div>
                            <span className="text-slate-500">Resp: {item.responsible}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor & Guest templates */}
              {aiPlan && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="font-outfit font-bold text-lg text-white mb-4">Generated Communications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Invitation Template</h4>
                      {editingPlan ? (
                        <textarea
                          value={editedGuestMessages.invitation}
                          onChange={(e) => setEditedGuestMessages({ ...editedGuestMessages, invitation: e.target.value })}
                          rows={6}
                          className="glass-input w-full text-xs"
                        />
                      ) : (
                        <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-lg text-xs leading-relaxed text-slate-300 h-44 overflow-y-auto whitespace-pre-line">
                          {editedGuestMessages.invitation}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Vendor Inquiry Template</h4>
                      {editingPlan ? (
                        <textarea
                          value={editedVendorMessages[0]?.draft_message || ''}
                          onChange={(e) => {
                            const list = [...editedVendorMessages];
                            if (list[0]) {
                              list[0].draft_message = e.target.value;
                              setEditedVendorMessages(list);
                            }
                          }}
                          rows={6}
                          className="glass-input w-full text-xs"
                        />
                      ) : (
                        <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-lg text-xs leading-relaxed text-slate-300 h-44 overflow-y-auto whitespace-pre-line">
                          {editedVendorMessages[0]?.draft_message || 'No messages generated.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Col: Actions, Budget allocate, Risk Analysis */}
            <div className="space-y-6">
              
              {/* Review / Save Plan actions */}
              {aiPlan && canEdit && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="font-outfit font-bold text-sm text-white mb-4">Review Plan Settings</h3>
                  <div className="space-y-3">
                    {editingPlan ? (
                      <>
                        <button 
                          onClick={() => saveEditedPlan(false)}
                          className="glass-btn-secondary w-full"
                        >
                          Save Draft Changes
                        </button>
                        <button 
                          onClick={() => saveEditedPlan(true)}
                          className="glass-btn-primary w-full flex items-center justify-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Approve & Lock Plan</span>
                        </button>
                        <button 
                          onClick={() => setEditingPlan(false)}
                          className="text-xs text-slate-500 hover:text-white w-full text-center py-2"
                        >
                          Cancel Editing
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => setEditingPlan(true)}
                          className="glass-btn-secondary w-full flex items-center justify-center space-x-1.5"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit Recommendations</span>
                        </button>
                        <button 
                          onClick={handleGenerateAIPlan}
                          disabled={aiPlanLoading}
                          className="glass-btn-primary w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 flex items-center justify-center space-x-1.5"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Regenerate AI recommendations</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Budget Allocation Pie */}
              {aiPlan && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="font-outfit font-bold text-sm text-white mb-3">AI Budget Breakdown</h3>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={editedBudgetAlloc}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="category"
                        >
                          {editedBudgetAlloc.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto mt-2">
                    {editedBudgetAlloc.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-slate-350">{item.category} ({item.percentage}%)</span>
                        </div>
                        <span className="font-medium text-slate-200">${item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contingencies & Risks analysis */}
              {aiPlan && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="font-outfit font-bold text-sm text-white mb-4">Contingency Backup Plans</h3>
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    {editedRisks.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-200">{item.risk}</span>
                          <span className={`text-[10px] font-bold px-1.5 rounded ${item.impact === 'High' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'}`}>
                            {item.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          <span className="text-indigo-400 font-semibold">Backup:</span> {item.backup_plan}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ================= TAB 2: AGENDA / RUN OF SHOW ================= */}
        {activeTab === 'agenda' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header info & Add agenda button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-outfit font-bold text-xl text-white">Event Agenda Schedule</h3>
                <p className="text-slate-400 text-xs mt-0.5">Specify chronological sessions, speakers, and timing blocks.</p>
              </div>
              {canEdit && event.status !== 'archived' && (
                <button 
                  onClick={() => setShowAddAgenda(true)}
                  className="glass-btn-primary flex items-center space-x-1.5 py-2 px-4 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Session</span>
                </button>
              )}
            </div>

            {/* Add Agenda form */}
            {showAddAgenda && (
              <form onSubmit={handleAddAgenda} className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm text-white">Add Agenda Session</h4>
                  <button type="button" onClick={() => setShowAddAgenda(false)} className="text-slate-500 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Session Title</label>
                  <input
                    type="text"
                    required
                    value={agendaTitle}
                    onChange={(e) => setAgendaTitle(e.target.value)}
                    placeholder="Welcome & Registrations"
                    className="glass-input text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={agendaStart}
                      onChange={(e) => setAgendaStart(e.target.value)}
                      className="glass-input text-sm bg-slate-950"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={agendaEnd}
                      onChange={(e) => setAgendaEnd(e.target.value)}
                      className="glass-input text-sm bg-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Speaker / Host name</label>
                    <input
                      type="text"
                      value={agendaSpeaker}
                      onChange={(e) => setAgendaSpeaker(e.target.value)}
                      placeholder="Jane Doe (CEO)"
                      className="glass-input text-sm"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Description</label>
                    <input
                      type="text"
                      value={agendaDesc}
                      onChange={(e) => setAgendaDesc(e.target.value)}
                      placeholder="Introductory session with coffee briefing"
                      className="glass-input text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddAgenda(false)} className="glass-btn-secondary py-2 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn-primary py-2 text-xs">
                    Save Session
                  </button>
                </div>
              </form>
            )}

            {/* Agenda list */}
            {agenda.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/20 border border-dashed border-slate-850 rounded-2xl">
                <Clock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h4 className="font-bold text-white text-sm">No Sessions Created</h4>
                <p className="text-xs text-slate-400 mt-1">Add sessions or review AI run-of-show suggestions.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-violet-500/20 ml-4 pl-6 space-y-6 py-2">
                {agenda.map((session) => (
                  <div key={session.id} className="relative group bg-slate-900/30 border border-slate-850 p-5 rounded-2xl hover:border-slate-800 transition-all">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[31px] top-6 bg-violet-600 border-4 border-slate-950 h-4.5 w-4.5 rounded-full"></div>

                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="font-bold text-sm text-violet-400">
                            {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] text-slate-500">• {new Date(session.start_time).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-outfit font-bold text-lg text-white mt-1">{session.title}</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{session.description || 'No description provided.'}</p>
                        {session.speaker && (
                          <div className="mt-3.5 inline-flex items-center space-x-1.5 bg-slate-950/60 border border-slate-850 px-3 py-1 rounded-full text-[10px] text-slate-350">
                            <Users className="h-3.5 w-3.5 text-violet-400" />
                            <span>Speaker: <strong className="text-white">{session.speaker}</strong></span>
                          </div>
                        )}
                      </div>

                      {canEdit && event.status !== 'archived' && (
                        <button
                          onClick={() => handleDeleteAgenda(session.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 3: TASKS ================= */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left 3 columns: Task list boards */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-outfit font-bold text-xl text-white">Event Task Checklist</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Define checklists, set up task dependencies, and track blockers.</p>
                </div>
                {canEdit && event.status !== 'archived' && (
                  <button 
                    onClick={() => setShowAddTask(true)}
                    className="glass-btn-primary flex items-center space-x-1.5 py-2 px-4 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>

              {/* Add Task Form */}
              {showAddTask && (
                <form onSubmit={handleAddTask} className="glass-panel rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm text-white">Create Event Task</h4>
                    <button type="button" onClick={() => setShowAddTask(false)} className="text-slate-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Task Title</label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Book Catering Vendor"
                      className="glass-input text-sm"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Description</label>
                    <textarea
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Select catering options and pay vendor booking fee"
                      rows={2}
                      className="glass-input text-sm resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Assignee Email</label>
                      <input
                        type="email"
                        value={taskAssignee}
                        onChange={(e) => setTaskAssignee(e.target.value)}
                        placeholder="organizer@company.com"
                        className="glass-input text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Deadline Date</label>
                      <input
                        type="date"
                        value={taskDeadline}
                        onChange={(e) => setTaskDeadline(e.target.value)}
                        className="glass-input text-sm bg-slate-950 text-slate-100"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Depends On Task</label>
                      <select
                        value={taskDependency}
                        onChange={(e) => setTaskDependency(e.target.value)}
                        className="glass-input text-sm bg-slate-950"
                      >
                        <option value="">No Precursor Task</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setShowAddTask(false)} className="glass-btn-secondary py-2 text-xs">
                      Cancel
                    </button>
                    <button type="submit" className="glass-btn-primary py-2 text-xs">
                      Create Task
                    </button>
                  </div>
                </form>
              )}

              {/* Task Cards Grid */}
              {tasks.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/20 border border-dashed border-slate-850 rounded-2xl">
                  <CheckSquare className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h4 className="font-bold text-white text-sm">Task checklist is empty</h4>
                  <p className="text-xs text-slate-400 mt-1">Create items to direct coordinating staff.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const assignee = task.assignee_id ? 'Assigned' : 'Unassigned';
                    const dependencyTask = tasks.find(t => t.id === task.dependency_id);
                    
                    return (
                      <div key={task.id} className="glass-panel rounded-2xl p-5 border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between md:flex-row md:items-center gap-4">
                        <div className="space-y-2 flex-1">
                          
                          {/* Title & Status */}
                          <div className="flex items-center space-x-2 flex-wrap gap-1">
                            <h4 className="font-bold text-white text-base">{task.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              task.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/20' : 
                              task.status === 'blocked' ? 'bg-red-950 text-red-400 border border-red-900/20' : 
                              task.status === 'in_progress' ? 'bg-violet-950 text-violet-400 border border-violet-900/20' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {task.status}
                            </span>
                            {task.approval_status === 'approved' && (
                              <span className="bg-blue-950 text-blue-400 text-[10px] px-2 rounded flex items-center space-x-0.5 border border-blue-900/20 font-bold">
                                <Check className="h-3 w-3" />
                                <span>Approved</span>
                              </span>
                            )}
                          </div>

                          <p className="text-slate-400 text-xs leading-relaxed">{task.description}</p>
                          
                          {/* Details line */}
                          <div className="flex flex-wrap items-center gap-4 pt-2 text-[10px] text-slate-500">
                            {task.deadline && (
                              <span>Deadline: <strong className="text-slate-350">{new Date(task.deadline).toLocaleDateString()}</strong></span>
                            )}
                            {dependencyTask && (
                              <span className="text-amber-400">Depends on: {dependencyTask.title}</span>
                            )}
                            {task.blocker && (
                              <span className="text-red-400 font-semibold">Blocker: {task.blocker}</span>
                            )}
                          </div>

                        </div>

                        {/* Status update / Actions */}
                        {canEdit && event.status !== 'archived' && (
                          <div className="flex flex-wrap items-center gap-2">
                            
                            {/* Blocker trigger */}
                            {task.status !== 'completed' && (
                              <button
                                onClick={() => {
                                  const text = window.prompt('Define blocker description (leave blank to unblock):', task.blocker);
                                  if (text !== null) handleUpdateTaskBlocker(task.id, text);
                                }}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-350 text-[11px] rounded font-semibold border border-slate-800"
                              >
                                {task.blocker ? 'Edit Blocker' : 'Add Blocker'}
                              </button>
                            )}

                            {/* Status cycle */}
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-[11px] font-semibold text-slate-300"
                            >
                              <option value="todo">Todo</option>
                              <option value="in_progress">In Progress</option>
                              <option value="blocked">Blocked</option>
                              <option value="completed">Completed</option>
                            </select>

                            {/* Approval option */}
                            {task.status === 'completed' && task.approval_status !== 'approved' && (
                              <button
                                onClick={() => handleApproveTask(task.id)}
                                className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900/20 text-emerald-400 text-[11px] rounded font-semibold flex items-center space-x-1"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-500 hover:text-red-400 p-2 transition-colors rounded hover:bg-slate-850"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Right column: Task stats summary */}
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="font-outfit font-bold text-sm text-white mb-4">Task completion status</h3>
                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-500">No tasks loaded to generate statistics.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Completed ratio</span>
                        <span>{Math.round((tasks.filter(t => t.status === 'completed' || t.status === 'approved').length / tasks.length) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(tasks.filter(t => t.status === 'completed' || t.status === 'approved').length / tasks.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Active Blockers:</span>
                        <span className="text-red-400 font-bold">{tasks.filter(t => t.status === 'blocked').length}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>In Progress:</span>
                        <span className="text-violet-400 font-bold">{tasks.filter(t => t.status === 'in_progress').length}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Awaiting Approval:</span>
                        <span className="text-amber-400 font-bold">{tasks.filter(t => t.status === 'completed' && t.approval_status !== 'approved').length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: VENDORS & BUDGET ================= */}
        {activeTab === 'vendors' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Vendor listings and Bid management */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-outfit font-bold text-xl text-white">Vendor Quotations</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Manage bidder quotations, contract status, and invoice payments.</p>
                </div>
                {canEdit && event.status !== 'archived' && (
                  <button 
                    onClick={() => setShowAddVendor(true)}
                    className="glass-btn-primary flex items-center space-x-1.5 py-2 px-4 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Record Quote</span>
                  </button>
                )}
              </div>

              {/* Add Vendor quote form */}
              {showAddVendor && (
                <form onSubmit={handleAddVendor} className="glass-panel rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm text-white">Add Vendor Quote</h4>
                    <button type="button" onClick={() => setShowAddVendor(false)} className="text-slate-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Company / Vendor Name</label>
                      <input
                        type="text"
                        required
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="Golden Platter Catering"
                        className="glass-input text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Category</label>
                      <select
                        value={vendorCategory}
                        onChange={(e) => setVendorCategory(e.target.value)}
                        className="glass-input text-sm bg-slate-950"
                      >
                        <option value="Catering">Catering (Food & Drinks)</option>
                        <option value="AV/Lighting">Audio-Visual / Staging</option>
                        <option value="Venue Decoration">Venue Decoration / Florist</option>
                        <option value="Security">Security & Logistics</option>
                        <option value="Staffing">Staffing Agencies</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Quote Valuation ($)</label>
                      <input
                        type="number"
                        required
                        value={vendorQuote}
                        onChange={(e) => setVendorQuote(e.target.value)}
                        className="glass-input text-sm"
                        min={0}
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        placeholder="contracts@goldenplatter.com"
                        className="glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setShowAddVendor(false)} className="glass-btn-secondary py-2 text-xs">
                      Cancel
                    </button>
                    <button type="submit" className="glass-btn-primary py-2 text-xs">
                      Save Quote
                    </button>
                  </div>
                </form>
              )}

              {/* Vendor bids list */}
              {vendors.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/20 border border-dashed border-slate-850 rounded-2xl">
                  <Truck className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h4 className="font-bold text-white text-sm">No recorded vendors</h4>
                  <p className="text-xs text-slate-400 mt-1">Record bids to analyze quotes and tracking budget.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="glass-panel rounded-2xl p-5 border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between md:flex-row md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <h4 className="font-bold text-white text-base">{vendor.name}</h4>
                          <span className="bg-slate-950 border border-slate-850 text-slate-400 text-[10px] px-2 py-0.5 rounded font-medium">
                            {vendor.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                          <span>Quote: <strong className="text-slate-200">${Number(vendor.quotation).toLocaleString()}</strong></span>
                          {vendor.contact_email && (
                            <span>Email: <span className="text-slate-400">{vendor.contact_email}</span></span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        
                        {/* Approval status dropdown */}
                        {canEdit && event.status !== 'archived' && (
                          <select
                            value={vendor.status}
                            onChange={(e) => handleUpdateVendorStatus(vendor.id, e.target.value)}
                            className={`px-2.5 py-1.5 rounded text-[11px] font-semibold border ${
                              vendor.status === 'approved' ? 'bg-emerald-950 border-emerald-900/20 text-emerald-400' :
                              vendor.status === 'rejected' ? 'bg-red-950 border-red-900/20 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <option value="pending">Pending bid</option>
                            <option value="approved">Approve Bid</option>
                            <option value="rejected">Reject Bid</option>
                          </select>
                        )}

                        {/* Payment Status Dropdown */}
                        {canEdit && event.status !== 'archived' && vendor.status === 'approved' && (
                          <select
                            value={vendor.payment_status}
                            onChange={(e) => handleUpdateVendorPayment(vendor.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-[11px] font-semibold text-slate-350"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="paid">Fully Paid</option>
                          </select>
                        )}

                        {/* Delete Quote button */}
                        {canEdit && event.status !== 'archived' && (
                          <button
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="text-slate-500 hover:text-red-400 p-2 rounded hover:bg-slate-850"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Right column: Budget details charts */}
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="font-outfit font-bold text-sm text-white mb-4 font-semibold uppercase tracking-wider">Budget Balance Sheet</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Estimated Event Budget:</div>
                    <div className="text-2xl font-extrabold text-white mt-1">${Number(event.budget).toLocaleString()}</div>
                  </div>

                  <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Approved Vendor Expenses:</div>
                    <div className="text-2xl font-extrabold text-violet-400 mt-1">${totalApprovedQuotes.toLocaleString()}</div>
                  </div>

                  <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Remaining Surplus/Deficit:</div>
                    <div className={`text-2xl font-extrabold mt-1 ${
                      Number(event.budget) - totalApprovedQuotes >= 0 ? 'text-emerald-450' : 'text-red-400'
                    }`}>
                      ${(Number(event.budget) - totalApprovedQuotes).toLocaleString()}
                    </div>
                  </div>

                  {/* Expense bar chart */}
                  {totalApprovedQuotes > 0 && (
                    <div>
                      <h4 className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Budget Usage Ratio</h4>
                      <div className="w-full bg-slate-950 border border-slate-850 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-350 ${
                            totalApprovedQuotes > Number(event.budget) ? 'bg-red-500' : 'bg-violet-500'
                          }`}
                          style={{ width: `${Math.min((totalApprovedQuotes / Number(event.budget)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 5: LOGISTICS ================= */}
        {activeTab === 'logistics' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-outfit font-bold text-xl text-white">Event Room Setup & Equipment</h3>
                <p className="text-slate-400 text-xs mt-0.5">Specify seating plans, visual layouts, sound equipment, and personnel.</p>
              </div>
              {canEdit && event.status !== 'archived' && (
                <button 
                  onClick={handleSaveLogistics}
                  disabled={savingLogistics}
                  className="glass-btn-primary flex items-center space-x-1.5 py-2 px-5"
                >
                  {savingLogistics ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Logistics Plan</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Room setup text */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Staging & Room Setup</h4>
                <textarea
                  disabled={!canEdit || event.status === 'archived'}
                  value={roomSetup}
                  onChange={(e) => setRoomSetup(e.target.value)}
                  placeholder="Describe main stage setup, podium layout, AV control booth, and entrance gates..."
                  rows={4}
                  className="glass-input w-full resize-none text-sm leading-relaxed"
                />
              </div>

              {/* Seating Layout text */}
              <div className="glass-panel rounded-2xl p-6 flex flex-col space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Seating & Table Arrangement</h4>
                <textarea
                  disabled={!canEdit || event.status === 'archived'}
                  value={seatingLayout}
                  onChange={(e) => setSeatingLayout(e.target.value)}
                  placeholder="E.g., Round tables of 8 guests, structured VIP lounge near the stage, classroom style for seating blocks..."
                  rows={4}
                  className="glass-input w-full resize-none text-sm leading-relaxed"
                />
              </div>

            </div>

            {/* Equipment and Staff checklist arrays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Equipment list */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Equipment Inventory</h4>
                  {canEdit && event.status !== 'archived' && (
                    <button onClick={addEquipment} className="text-violet-400 hover:text-violet-300 text-xs font-semibold flex items-center space-x-1">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Equipment</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {equipmentList.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No inventory items declared.</p>
                  ) : (
                    equipmentList.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          disabled={!canEdit || event.status === 'archived'}
                          type="text"
                          value={item.name}
                          onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                          placeholder="Projector, Mic"
                          className="glass-input text-xs flex-1 py-1"
                        />
                        <input
                          disabled={!canEdit || event.status === 'archived'}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateEquipment(index, 'quantity', Number(e.target.value))}
                          className="glass-input text-xs w-16 py-1"
                          min={1}
                        />
                        <select
                          disabled={!canEdit || event.status === 'archived'}
                          value={item.status}
                          onChange={(e) => updateEquipment(index, 'status', e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-350 text-[10px] rounded px-1 py-1"
                        >
                          <option value="needed">Needed</option>
                          <option value="secured">Secured</option>
                        </select>
                        {canEdit && event.status !== 'archived' && (
                          <button onClick={() => removeEquipment(index)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Staffing checklist */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Staffing & Staff Assignments</h4>
                  {canEdit && event.status !== 'archived' && (
                    <button onClick={addStaff} className="text-violet-400 hover:text-violet-300 text-xs font-semibold flex items-center space-x-1">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Staff Role</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {staffingList.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No staff rolls created.</p>
                  ) : (
                    staffingList.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          disabled={!canEdit || event.status === 'archived'}
                          type="text"
                          value={item.role}
                          onChange={(e) => updateStaff(index, 'role', e.target.value)}
                          placeholder="Registration host"
                          className="glass-input text-xs flex-1 py-1"
                        />
                        <input
                          disabled={!canEdit || event.status === 'archived'}
                          type="number"
                          value={item.count}
                          onChange={(e) => updateStaff(index, 'count', Number(e.target.value))}
                          className="glass-input text-xs w-14 py-1"
                          min={1}
                        />
                        <input
                          disabled={!canEdit || event.status === 'archived'}
                          type="text"
                          value={item.assigned || ''}
                          onChange={(e) => updateStaff(index, 'assigned', e.target.value)}
                          placeholder="Assignee Name"
                          className="glass-input text-xs w-28 py-1"
                        />
                        {canEdit && event.status !== 'archived' && (
                          <button onClick={() => removeStaff(index)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 6: ATTENDEES / GUEST REGISTRATIONS ================= */}
        {activeTab === 'attendees' && (
          <div className="max-w-5xl mx-auto space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-outfit font-bold text-xl text-white">Registered Guests</h3>
                <p className="text-slate-400 text-xs mt-0.5">Invite guests, track dietary requirements, and coordinate check-in entries.</p>
              </div>
              {canEdit && event.status !== 'archived' && (
                <button 
                  onClick={() => setShowAddAttendee(true)}
                  className="glass-btn-primary flex items-center space-x-1.5 py-2 px-4 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Guest</span>
                </button>
              )}
            </div>

            {/* Add Attendee form */}
            {showAddAttendee && (
              <form onSubmit={handleAddAttendee} className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm text-white">Invite / Add Guest</h4>
                  <button type="button" onClick={() => setShowAddAttendee(false)} className="text-slate-500 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Guest Full Name</label>
                    <input
                      type="text"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      placeholder="Jane Doe"
                      className="glass-input text-sm"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="glass-input text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Dietary Requirements / Allergies</label>
                  <input
                    type="text"
                    value={attendeeDiet}
                    onChange={(e) => setAttendeeDiet(e.target.value)}
                    placeholder="E.g., Vegetarian, Peanut allergy, None..."
                    className="glass-input text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setShowAddAttendee(false)} className="glass-btn-secondary py-2 text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="glass-btn-primary py-2 text-xs">
                    Invite Guest
                  </button>
                </div>
              </form>
            )}

            {/* Attendees guest grid lists */}
            {attendees.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/20 border border-dashed border-slate-850 rounded-2xl">
                <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <h4 className="font-bold text-white text-sm">Guest list is empty</h4>
                <p className="text-xs text-slate-400 mt-1">Add guests to send invitation messages.</p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-850">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-900/60 text-xs font-bold text-slate-400 uppercase">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Dietary Notes</th>
                        <th className="p-4">RSVP Status</th>
                        <th className="p-4 text-center">Check-In Status</th>
                        {canEdit && event.status !== 'archived' && (
                          <th className="p-4 text-right">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {attendees.map((guest) => (
                        <tr key={guest.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-4 font-medium text-white">{guest.name}</td>
                          <td className="p-4 text-slate-400">{guest.email}</td>
                          <td className="p-4">
                            {guest.dietary_needs ? (
                              <span className="bg-amber-950/40 text-amber-350 border border-amber-900/20 px-2 py-0.5 rounded text-xs">
                                {guest.dietary_needs}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            {canEdit && event.status !== 'archived' ? (
                              <select
                                value={guest.invitation_status}
                                onChange={(e) => handleUpdateRsvp(guest.id, e.target.value)}
                                className={`bg-slate-950 border border-slate-800 text-xs px-2 py-1 rounded cursor-pointer ${
                                  guest.invitation_status === 'confirmed' ? 'text-emerald-400 font-semibold' :
                                  guest.invitation_status === 'declined' ? 'text-red-400' : 'text-slate-400'
                                }`}
                              >
                                <option value="sent">Sent</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="declined">Declined</option>
                              </select>
                            ) : (
                              <span className={`text-xs font-bold ${
                                guest.invitation_status === 'confirmed' ? 'text-emerald-450' : 'text-slate-400'
                              }`}>{guest.invitation_status}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              {canEdit && event.status !== 'archived' ? (
                                <button
                                  onClick={() => handleToggleCheckIn(guest.id, guest.check_in_status)}
                                  className={`p-1.5 rounded-full border transition-all ${
                                    guest.check_in_status 
                                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400' 
                                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                                  }`}
                                  title={guest.check_in_status ? 'Click to Check Out' : 'Click to Check In'}
                                >
                                  {guest.check_in_status ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                </button>
                              ) : (
                                <span className={`text-xs font-bold ${
                                  guest.check_in_status ? 'text-emerald-400' : 'text-slate-500'
                                }`}>
                                  {guest.check_in_status ? 'Checked In' : 'No Entry'}
                                </span>
                              )}
                            </div>
                          </td>
                          {canEdit && event.status !== 'archived' && (
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteAttendee(guest.id)}
                                className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default EventDetail;
