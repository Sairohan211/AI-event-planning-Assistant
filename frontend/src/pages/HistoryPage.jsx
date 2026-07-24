import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Clock, Sparkles, Award, Calendar, CheckSquare, Shield, Play } from 'lucide-react';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [learningHistory, setLearningHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [eventsRes, learningRes] = await Promise.all([
        api.get('/events'),
        api.get('/learning')
      ]);
      
      setEvents(eventsRes.data);
      setLearningHistory(learningRes.data);
    } catch (err) {
      console.error('Failed to fetch historical logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="h-10 w-10 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm mt-4">Compiling history metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      
      {/* Header */}
      <div className="mb-10 flex items-center space-x-3">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-violet-500/20">
          <Clock className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white">Planning History</h1>
          <p className="text-slate-400 mt-1">Review saved AI event concepts, timelines, and study log records.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Event AI Plans list */}
        <div className="space-y-6">
          <h2 className="font-outfit font-bold text-lg text-white flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <span>AI Event Briefs & Concepts</span>
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-850 rounded-2xl">
              <p className="text-slate-400 text-sm">No event plans created.</p>
              <Link to="/events/new" className="glass-btn-primary py-2 text-xs mt-3 inline-block">Draft Plan Now</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="glass-card rounded-2xl p-5 border border-slate-850 hover:border-slate-800 transition-all cursor-pointer relative"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-violet-950/60 text-violet-300 border border-violet-900/30 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {event.type}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      event.status === 'archived' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-450'
                    }`}>
                      {event.status}
                    </span>
                  </div>

                  <h3 className="font-outfit font-bold text-lg text-white line-clamp-1">{event.title}</h3>
                  <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{event.objective || 'No objectives declared.'}</p>
                  
                  <div className="flex items-center space-x-4 text-[10px] text-slate-500 mt-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </span>
                    <span>Budget: <strong>${Number(event.budget).toLocaleString()}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Study history */}
        <div className="space-y-6">
          <h2 className="font-outfit font-bold text-lg text-white flex items-center space-x-2">
            <Award className="h-5 w-5 text-violet-400" />
            <span>Academy Evaluation History</span>
          </h2>

          {learningHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-850 rounded-2xl">
              <p className="text-slate-400 text-sm">No Academy lessons completed.</p>
              <Link to="/academy" className="glass-btn-primary py-2 text-xs mt-3 inline-block">Visit Academy</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {learningHistory.map((item) => (
                <div key={item.session_id} className="glass-panel rounded-2xl p-5 border border-slate-850">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-outfit font-bold text-base text-white">{item.topic}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Completed on {new Date(item.session_date).toLocaleDateString()}</span>
                      </p>
                    </div>

                    {item.score !== null ? (
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-violet-400">{item.score} / {item.total_questions}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">Quiz Score</div>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-400 bg-amber-950/20 border border-amber-900/20 px-2 py-0.5 rounded">
                        Evaluation Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default HistoryPage;
