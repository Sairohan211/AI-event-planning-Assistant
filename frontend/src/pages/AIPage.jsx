import React, { useState } from 'react';
import api from '../api';
import { Sparkles, BookOpen, GraduationCap, ChevronRight, HelpCircle, Check, AlertCircle } from 'lucide-react';

const AIPage = () => {
  const [topic, setTopic] = useState('');
  const [studyContent, setStudyContent] = useState('');
  const [quizId, setQuizId] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active quiz playing states
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizReview, setQuizReview] = useState(null); // detailed explanations

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');
    setStudyContent('');
    setQuizQuestions([]);
    setQuizMode(false);
    setQuizSubmitted(false);
    setQuizReview(null);

    try {
      const res = await api.post('/learning', { topic });
      setStudyContent(res.data.studyContent);
      setQuizQuestions(res.data.questions);
      setQuizId(res.data.quizId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start learning session.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    if (quizSubmitted) return;
    setUserAnswers({
      ...userAnswers,
      [currentQuestionIndex]: optionIndex
    });
  };

  const handleSubmitQuiz = async () => {
    // Make sure all answered
    if (Object.keys(userAnswers).length < quizQuestions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    try {
      // Calculate score locally to store
      // Let's send the answers map (questionIdx -> selectedIndex) to backend.
      // The backend will score it and return correct indexes and explanations.
      // Let's call the backend save results endpoint
      const answersArray = quizQuestions.map((_, idx) => userAnswers[idx]);
      
      // Compute mock score to submit
      // Since backend has the correct answer indexes, we can ask backend to score it
      const res = await api.post('/learning/quiz-result', {
        quizId,
        answers: answersArray,
        total_questions: quizQuestions.length,
        score: 0 // Backend will evaluate and overwrite or save this
      });

      // The backend returns the list of questions with correct answerIndex and explanation!
      const detailedResults = res.data.detailedResults;
      
      // Calculate score
      let calculatedScore = 0;
      detailedResults.forEach((q, idx) => {
        if (q.answerIndex === userAnswers[idx]) {
          calculatedScore += 1;
        }
      });

      // Re-submit correct score if necessary, or just display local state
      setQuizReview(detailedResults);
      setQuizSubmitted(true);
    } catch (err) {
      alert('Failed to submit quiz results.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setQuizSubmitted(false);
    setQuizReview(null);
    setQuizMode(false);
  };

  // Score computation
  const getScore = () => {
    if (!quizReview) return 0;
    return quizReview.filter((q, idx) => q.answerIndex === userAnswers[idx]).length;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      
      {/* Academy Header */}
      <div className="mb-10 flex items-center space-x-3">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-violet-500/20">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white">Organizer Academy</h1>
          <p className="text-slate-400 mt-1">Acquire event planning skills, study lectures, and take training quizzes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Topic selector */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-outfit font-bold text-base text-white mb-4">Start Training Session</h3>
            
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Learning Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Budget Allocation, AV Setup, Crowd Control"
                  className="glass-input text-sm w-full"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="glass-btn-primary w-full flex items-center justify-center space-x-2 py-3"
              >
                {loading && !quizMode ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    <span>Generate Lecture</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {studyContent && !quizMode && (
            <div className="glass-panel rounded-2xl p-6 text-center border-emerald-500/10">
              <GraduationCap className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <h4 className="font-bold text-white text-sm">Lecture notes ready</h4>
              <p className="text-xs text-slate-400 mt-1">Read the notes thoroughly then test your skills with a quiz.</p>
              <button 
                onClick={() => setQuizMode(true)}
                className="glass-btn-primary py-2 px-6 mt-4 w-full"
              >
                Take Practice Quiz
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Lecture Notes or Quiz View */}
        <div className="lg:col-span-2">
          
          {error && (
            <div className="flex items-center space-x-2 bg-red-950/40 border border-red-900/50 text-red-200 p-4 rounded-xl mb-6">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!studyContent ? (
            <div className="text-center py-24 glass-panel rounded-2xl border-dashed border-slate-850">
              <GraduationCap className="h-14 w-14 text-slate-700 mx-auto mb-4" />
              <h3 className="font-outfit font-bold text-lg text-white">Academy Study Lounge</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Input a topic on the left panel to generate curriculum notes and evaluations.</p>
            </div>
          ) : (
            /* Study Notes View */
            !quizMode ? (
              <div className="glass-panel rounded-2xl p-8 space-y-6">
                <div className="pb-4 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest bg-violet-950/40 px-3 py-1 border border-violet-900/30 rounded-full">
                    Lecture Notes
                  </span>
                  <span className="text-xs text-slate-500">Topic: {topic}</span>
                </div>
                <div className="prose prose-invert text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {studyContent}
                </div>
                <div className="pt-6 border-t border-slate-850 flex justify-end">
                  <button 
                    onClick={() => setQuizMode(true)}
                    className="glass-btn-primary flex items-center space-x-1.5"
                  >
                    <span>Proceed to Evaluation</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Quiz Player View */
              <div className="glass-panel rounded-2xl p-8 space-y-6">
                
                {/* Header Progress */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-850">
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
                    Training Quiz: {topic}
                  </span>
                  {!quizSubmitted && (
                    <span className="text-xs text-slate-400 font-medium">
                      Question {currentQuestionIndex + 1} of {quizQuestions.length}
                    </span>
                  )}
                </div>

                {/* Score Summary */}
                {quizSubmitted && quizReview && (
                  <div className="p-6 bg-slate-900/50 border border-slate-850 rounded-2xl text-center space-y-3">
                    <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Evaluation Score</div>
                    <div className="text-4xl font-extrabold text-white">
                      {getScore()} / {quizQuestions.length}
                    </div>
                    <div className="text-xs text-indigo-400">
                      {getScore() >= 4 ? 'Distinguished Master Coordinator!' : 'Review lecture details and try again.'}
                    </div>
                    <button 
                      onClick={handleResetQuiz}
                      className="glass-btn-secondary py-2 px-4 text-xs mt-2"
                    >
                      Restart Quiz
                    </button>
                  </div>
                )}

                {/* Current Question */}
                {!quizSubmitted ? (
                  <div className="space-y-6">
                    <h3 className="font-outfit font-bold text-lg text-white">
                      {quizQuestions[currentQuestionIndex]?.question}
                    </h3>

                    <div className="space-y-3">
                      {quizQuestions[currentQuestionIndex]?.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswerSelect(idx)}
                          className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                            userAnswers[currentQuestionIndex] === idx 
                              ? 'bg-violet-950/40 border-violet-500 text-violet-300' 
                              : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>{option}</span>
                          {userAnswers[currentQuestionIndex] === idx && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center pt-6 border-t border-slate-850">
                      <button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                        className="glass-btn-secondary py-2 text-xs disabled:opacity-40"
                      >
                        Previous
                      </button>

                      {currentQuestionIndex < quizQuestions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                          className="glass-btn-primary py-2 text-xs"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={loading}
                          className="glass-btn-primary py-2 text-xs bg-emerald-650"
                        >
                          {loading ? 'Submitting...' : 'Submit Answers'}
                        </button>
                      )}
                    </div>

                  </div>
                ) : (
                  /* Review explanations */
                  quizReview && (
                    <div className="space-y-6">
                      <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Detailed Review</h4>
                      <div className="space-y-4">
                        {quizReview.map((q, idx) => {
                          const isCorrect = q.answerIndex === userAnswers[idx];
                          return (
                            <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-red-950/20 border-red-900/30'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <h5 className="font-bold text-white text-sm">{idx + 1}. {q.question}</h5>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isCorrect ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>
                              
                              <div className="space-y-1.5 mt-3 text-xs">
                                <div>Selected: <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>{q.options[userAnswers[idx]]}</span></div>
                                {!isCorrect && (
                                  <div className="text-emerald-400 font-medium">Correct: <span>{q.options[q.answerIndex]}</span></div>
                                )}
                              </div>

                              <p className="text-xs text-slate-400 mt-3 leading-relaxed border-t border-slate-850/60 pt-2.5">
                                <span className="font-semibold text-slate-350">Explanation:</span> {q.explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
};

export default AIPage;
