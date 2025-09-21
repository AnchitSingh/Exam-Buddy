import React, { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { SOURCE_TYPE } from '../../utils/messages';

// Constants moved outside component for better performance
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

const questionCounts = [3, 5, 10, 15, 20];

// Use SOURCE_TYPE with fallbacks to prevent undefined key errors
const sourceOptions = [
  { value: SOURCE_TYPE?.MANUAL || 'MANUAL', label: 'Custom Topic', icon: '✏️' },
  { value: SOURCE_TYPE?.PAGE || 'PAGE', label: 'Current Page', icon: '📄' },
  { value: SOURCE_TYPE?.URL || 'URL', label: 'From URL', icon: '🔗' },
  { value: SOURCE_TYPE?.PDF || 'PDF', label: 'From PDF', icon: '📎' },
];

const QuizSetupModal = ({ isOpen, onClose, onStartQuiz }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState({});
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);

  const [config, setConfig] = useState({
    sourceType: SOURCE_TYPE.MANUAL,
    sourceValue: '', // URL or file name
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

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
  }, []);

  // Dynamic step numbering based on source type
  const getStepNumber = (step) => {
    if (step === 'source') return 1;
    if (step === 'describe') {
      return config.sourceType === SOURCE_TYPE.MANUAL ? 2 : null;
    }
    if (step === 'configure') {
      return config.sourceType === SOURCE_TYPE.MANUAL ? 3 : 2;
    }
    return null;
  };

  const handleInputChange = (field, value) => {
    // Validate timer logic
    if (field === 'questionTimer' && config.timerEnabled) {
      const maxQuestionTime = Math.floor(config.totalTimer / config.questionCount);
      value = Math.min(value, maxQuestionTime);
    }
    
    if (field === 'questionCount' && config.timerEnabled) {
      // Adjust question timer if needed
      const maxQuestionTime = Math.floor(config.totalTimer / value);
      if (config.questionTimer > maxQuestionTime) {
        setConfig(prev => ({ 
          ...prev, 
          [field]: value,
          questionTimer: maxQuestionTime 
        }));
        return;
      }
    }

    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for the field being edited
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSourceTypeChange = (sourceType) => {
    setConfig(prev => ({ 
      ...prev, 
      sourceType, 
      topic: '', 
      sourceValue: '',
      context: '' 
    }));
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors({});
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      handleInputChange('sourceValue', file.name);
      setErrors(prev => ({ ...prev, sourceValue: '' }));
    } else {
      setErrors(prev => ({ ...prev, sourceValue: 'Please select a valid PDF file.' }));
    }
  };

  const handleQuestionTypeToggle = (type) => {
    setConfig(prev => {
      const types = prev.questionTypes.includes(type)
        ? prev.questionTypes.filter(t => t !== type)
        : [...prev.questionTypes, type];
      
      // Ensure at least one type is selected
      if (types.length === 0) {
        return prev;
      }
      
      return { ...prev, questionTypes: types };
    });
    
    // Clear error if we now have valid selection
    if (errors.questionTypes) {
      setErrors(prev => ({ ...prev, questionTypes: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (config.sourceType === SOURCE_TYPE.MANUAL && !config.topic.trim()) {
      newErrors.topic = 'Please enter a topic for your quiz';
    }
    
    if (config.sourceType === SOURCE_TYPE.URL && !config.sourceValue.trim()) {
      newErrors.sourceValue = 'Please enter a valid URL';
    }
    
    if (config.sourceType === SOURCE_TYPE.PDF && !pdfFile) {
      newErrors.sourceValue = 'Please select a PDF file';
    }
    
    if (config.questionTypes.length === 0) {
      newErrors.questionTypes = 'Please select at least one question type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartQuiz = () => {
    if (!validateForm()) return;
    
    const finalConfig = { ...config, pdfFile };
    
    console.log('Starting quiz with config:', finalConfig);
    onStartQuiz(finalConfig);
    onClose();
    
    // Reset form
    setConfig({
      sourceType: SOURCE_TYPE.MANUAL,
      sourceValue: '',
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
    setPdfFile(null);
    setShowAdvanced(false);
    setErrors({});
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSourceInput = () => {
    switch (config.sourceType) {
      case SOURCE_TYPE.MANUAL:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quiz Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="e.g., World War II, Python Programming..."
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 ${
                  errors.topic ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.topic && <p className="text-red-500 text-xs mt-1">{errors.topic}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Context (Optional)
              </label>
              <textarea
                value={config.context}
                onChange={(e) => handleInputChange('context', e.target.value)}
                placeholder="Specific areas to focus on..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        );
        
      case SOURCE_TYPE.URL:
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Webpage URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={config.sourceValue}
              onChange={(e) => handleInputChange('sourceValue', e.target.value)}
              placeholder="https://..."
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 ${
                errors.sourceValue ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.sourceValue && <p className="text-red-500 text-xs mt-1">{errors.sourceValue}</p>}
          </div>
        );
        
      case SOURCE_TYPE.PDF:
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload PDF <span className="text-red-500">*</span>
            </label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              ref={fileInputRef} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={`w-full flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-xl transition-all hover:bg-slate-50 ${
                errors.sourceValue ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
            >
              <span className="text-sm">
                {pdfFile ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {pdfFile.name}
                  </span>
                ) : (
                  <span className="text-slate-500">Click to choose a PDF file</span>
                )}
              </span>
            </button>
            {errors.sourceValue && <p className="text-red-500 text-xs mt-1">{errors.sourceValue}</p>}
          </div>
        );
        
      case SOURCE_TYPE.PAGE:
        return (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-amber-800">
                The current active browser tab will be used as the source for this quiz.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-0">
        <div className="text-center pb-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">Create Your Quiz</h2>
          <p className="text-sm text-slate-500 mt-1">Set up your personalized learning experience</p>
        </div>

        <div className="pt-6 space-y-6">
          {/* Step 1: Source Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                {getStepNumber('source')}
              </div>
              <h3 className="text-base font-semibold text-slate-900">Choose your quiz source</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sourceOptions.map(opt => (
                <button 
                  key={opt.value} 
                  onClick={() => handleSourceTypeChange(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    config.sourceType === opt.value 
                      ? 'border-amber-300 bg-amber-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="pt-4">{renderSourceInput()}</div>
          </div>

          {/* Step 2/3: Basic Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                {getStepNumber('configure')}
              </div>
              <h3 className="text-base font-semibold text-slate-900">Configure your quiz</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Number of Questions</label>
                <div className="grid grid-cols-5 gap-2">
                  {questionCounts.map(count => (
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Difficulty Level</label>
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
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
            </button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-5 pt-5 border-t border-slate-100">
              
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
                        style={{ 
                          position: 'absolute', 
                          width: '1px', 
                          height: '1px', 
                          padding: 0, 
                          margin: '-1px', 
                          overflow: 'hidden', 
                          clip: 'rect(0,0,0,0)', 
                          whiteSpace: 'nowrap', 
                          border: 0 
                        }}
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
                {errors.questionTypes && (
                  <p className="text-red-500 text-xs mt-2">{errors.questionTypes}</p>
                )}
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
                        max={Math.min(300, Math.floor(config.totalTimer / config.questionCount))}
                        step="15"
                        value={config.questionTimer}
                        onChange={(e) => handleInputChange('questionTimer', parseInt(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                      {config.questionTimer * config.questionCount > config.totalTimer && (
                        <p className="text-amber-600 text-xs mt-1">
                          ⚠️ Question time adjusted to fit total time
                        </p>
                      )}
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
          >
            Start Quiz
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuizSetupModal;