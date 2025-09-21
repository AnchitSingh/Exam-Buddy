import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const QuizSetupModal = ({ isOpen, onClose, onStartQuiz }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState({});
  const [config, setConfig] = useState({
    // Basic Settings
    topic: '',
    context: '',
    questionCount: 5,
    difficulty: 'medium',
    
    // Advanced Settings
    questionTypes: ['MCQ'],
    immediateFeedback: true,
    customPrompt: '',
    timerEnabled: false,
    questionTimer: 60,
    totalTimer: 600,
  });

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleQuestionTypeToggle = (type) => {
    setConfig(prev => {
      const types = prev.questionTypes.includes(type)
        ? prev.questionTypes.filter(t => t !== type)
        : [...prev.questionTypes, type];
      
      // Ensure at least one type is selected
      return {
        ...prev,
        questionTypes: types.length > 0 ? types : ['MCQ']
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!config.topic.trim()) {
      newErrors.topic = 'Please enter a topic for your quiz';
    }
    
    if (config.questionTypes.length === 0) {
      newErrors.questionTypes = 'Please select at least one question type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartQuiz = () => {
    if (!validateForm()) return;
    
    console.log('Starting quiz with config:', config);
    onStartQuiz(config);
    onClose();
    
    // Reset form
    setConfig({
      topic: '',
      context: '',
      questionCount: 5,
      difficulty: 'medium',
      questionTypes: ['MCQ'],
      immediateFeedback: true,
      customPrompt: '',
      timerEnabled: false,
      questionTimer: 60,
      totalTimer: 600,
    });
    setShowAdvanced(false);
    setErrors({});
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { value: 'medium', label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { value: 'hard', label: 'Hard', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    { value: 'mixed', label: 'Mixed', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  ];

  const questionTypesData = [
    { value: 'MCQ', label: 'Multiple Choice', icon: '🔘' },
    { value: 'True/False', label: 'True/False', icon: '✓' },
    { value: 'Short Answer', label: 'Short Answer', icon: '✏️' },
    { value: 'Fill in Blank', label: 'Fill in Blank', icon: '📝' },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      size="lg"
    >
      <div className="space-y-0">
        
        {/* Header Section */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create Your Quiz</h2>
          <p className="text-sm text-slate-500 mt-1">Set up your personalized learning experience</p>
        </div>

        {/* Main Form Section */}
        <div className="pt-6 space-y-6">
          
          {/* Step 1: Topic Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-900">What would you like to study?</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quiz Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="e.g., World War II, Python Programming, Photosynthesis..."
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all ${
                  errors.topic ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              />
              {errors.topic && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.topic}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Context
                <span className="text-xs text-slate-400 font-normal ml-2">(Optional)</span>
              </label>
              <textarea
                value={config.context}
                onChange={(e) => handleInputChange('context', e.target.value)}
                placeholder="Specific areas to focus on or learning objectives..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none hover:border-slate-300"
              />
            </div>
          </div>

          {/* Step 2: Basic Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-900">Configure your quiz</h3>
            </div>

            {/* Question Count and Difficulty in a nice grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Number of Questions
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[3, 5, 10, 15, 20].map(count => (
                    <button
                      key={count}
                      onClick={() => handleInputChange('questionCount', count)}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        config.questionCount === count
                          ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                          : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {difficultyLevels.map(level => (
                    <button
                      key={level.value}
                      onClick={() => handleInputChange('difficulty', level.value)}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all border-2 ${
                        config.difficulty === level.value
                          ? `${level.bg} ${level.color} ${level.border}`
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors group"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>Advanced Settings</span>
              <span className="text-xs text-slate-400 ml-1">(Question types, timer, feedback)</span>
            </button>
          </div>

          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <div className="space-y-5 pt-5 border-t border-slate-100 animate-fade-in-up">
              
              {/* Question Types */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Question Types
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {questionTypesData.map(type => (
                    <label 
                      key={type.value} 
                      className={`relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        config.questionTypes.includes(type.value)
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={config.questionTypes.includes(type.value)}
                        onChange={() => handleQuestionTypeToggle(type.value)}
                        className="sr-only"
                      />
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium text-slate-700">{type.label}</span>
                      {config.questionTypes.includes(type.value) && (
                        <svg className="w-5 h-5 text-amber-600 absolute top-2 right-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Timer Settings */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    Enable Timer
                  </label>
                  <button
                    onClick={() => handleInputChange('timerEnabled', !config.timerEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.timerEnabled ? 'bg-amber-600' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.timerEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                {config.timerEnabled && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-2">
                        <span>Total Quiz Time</span>
                        <span className="font-mono font-medium">{formatTime(config.totalTimer)}</span>
                      </div>
                      <input
                        type="range"
                        min="300"
                        max="3600"
                        step="60"
                        value={config.totalTimer}
                        onChange={(e) => handleInputChange('totalTimer', parseInt(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-2">
                        <span>Time per Question</span>
                        <span className="font-mono font-medium">{config.questionTimer}s</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="300"
                        step="15"
                        value={config.questionTimer}
                        onChange={(e) => handleInputChange('questionTimer', parseInt(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback Setting */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Immediate Feedback
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Show correct answers after each question
                    </p>
                  </div>
                  <button
                    onClick={() => handleInputChange('immediateFeedback', !config.immediateFeedback)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.immediateFeedback ? 'bg-amber-600' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.immediateFeedback ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Instructions
                  <span className="text-xs text-slate-400 font-normal ml-2">(Optional)</span>
                </label>
                <textarea
                  value={config.customPrompt}
                  onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                  placeholder="Special instructions for question generation..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none text-sm hover:border-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
          <Button 
            onClick={onClose} 
            variant="secondary" 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartQuiz} 
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            disabled={!config.topic.trim()}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Quiz
            </span>
          </Button>
        </div>

      </div>
      
      {/* Add animation styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </Modal>
  );
};

export default QuizSetupModal;