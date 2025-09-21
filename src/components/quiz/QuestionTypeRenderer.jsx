import React, { useState } from 'react';
import AnswerOption from './AnswerOption';

const QuestionTypeRenderer = ({ 
  question, 
  selectedAnswer, 
  onAnswerSelect, 
  disabled,
  showResult, 
  immediateFeedback = true // Add this prop
}) => {
  const [textAnswer, setTextAnswer] = useState('');
  const [fillBlanks, setFillBlanks] = useState(['', '']);

  const handleBlankChange = (index, value) => {
    const newBlanks = [...fillBlanks];
    newBlanks[index] = value;
    setFillBlanks(newBlanks);
  };

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
		onAnswerSelect(0, false, false, textAnswer.trim()); // Will be evaluated by AI
    }
  };

  const handleFillBlankSubmit = () => {
    const allFilled = fillBlanks.every(blank => blank.trim() !== '');
    if (allFilled) {
      // Check against acceptable answers
      const isCorrect = question.acceptableAnswers?.some(acceptableSet =>
        acceptableSet.every((acceptable, index) =>
          fillBlanks[index]?.toLowerCase().trim() === acceptable.toLowerCase()
        )
      ) || false;
      
      onAnswerSelect(0, isCorrect, false, fillBlanks);
    }
  };
  // Auto-submit for subjective questions when immediate feedback is OFF
  const handleTextChange = (value) => {
    setTextAnswer(value);
    
    // If immediate feedback is off, auto-submit on text change (with debounce)
    if (!immediateFeedback && value.trim()) {
      clearTimeout(window.textAnswerTimeout);
      window.textAnswerTimeout = setTimeout(() => {
        onAnswerSelect(0, false, false, value.trim());
      }, 500);
    }
  };
  

  switch (question.type) {
    case 'MCQ':
      return (
        <div className="space-y-3 sm:space-y-4">
          {question.options.map((option, index) => (
            <AnswerOption
              key={index}
              option={option}
              letter={String.fromCharCode(65 + index)}
              selected={selectedAnswer?.optionIndex === index}
              disabled={disabled}
              onSelect={() => onAnswerSelect(index, option.isCorrect)}
              showResult={showResult}
              isCorrect={selectedAnswer?.optionIndex === index ? selectedAnswer.isCorrect : false}
            />
          ))}
        </div>
      );

    case 'True/False':
      return (
        <div className="space-y-3 sm:space-y-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswerSelect(index, option.isCorrect)}
              disabled={disabled}
              className={`w-full text-left p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                selectedAnswer?.optionIndex === index && showResult
                  ? selectedAnswer.isCorrect
                    ? 'border-green-400 bg-green-50'
                    : 'border-red-400 bg-red-50'
                  : selectedAnswer?.optionIndex === index
                    ? 'border-amber-400 bg-amber-50'
                    : disabled
                    ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              <div className="flex items-center justify-center">
                <span className={`text-2xl font-bold ${
                  selectedAnswer?.optionIndex === index && showResult
                    ? selectedAnswer.isCorrect ? 'text-green-700' : 'text-red-700'
                    : selectedAnswer?.optionIndex === index
                    ? 'text-amber-700'
                    : 'text-slate-700 group-hover:text-slate-800'
                }`}>
                  {option.text}
                </span>
              </div>
            </button>
          ))}
        </div>
      );

	  case 'Short Answer':
		return (
		  <div className="space-y-4">
			<div>
			  <label className="block text-sm font-medium text-slate-700 mb-2">
				Your Answer:
			  </label>
			  <textarea
				value={textAnswer}
				onChange={(e) => handleTextChange(e.target.value)}
				disabled={disabled}
				placeholder="Type your answer here..."
				rows={4}
				className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
			  />
			</div>
			
			{/* Show submit button only if immediate feedback is ON and not disabled */}
			{immediateFeedback && !disabled && (
			  <button
				onClick={handleTextSubmit}
				disabled={!textAnswer.trim()}
				className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			  >
				Submit Answer
			  </button>
			)}
			
			{/* Show answer status */}
			{!immediateFeedback && selectedAnswer?.textAnswer && (
			  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<p className="text-blue-800 font-medium">✓ Answer recorded</p>
				<p className="text-blue-700 text-sm mt-1">Will be evaluated at quiz completion</p>
			  </div>
			)}
			
			{showResult && selectedAnswer?.textAnswer && immediateFeedback && (
			  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<p className="text-blue-800 font-medium">Your answer: "{selectedAnswer.textAnswer}"</p>
				<p className="text-blue-700 text-sm mt-1">
				  {selectedAnswer.isCorrect ? '✅ AI evaluated as correct' : '❓ AI is evaluating...'}
				</p>
			  </div>
			)}
		  </div>
		);
  
	  case 'Fill in Blank':
		return (
		  <div className="space-y-4">
			<div className="text-lg leading-relaxed">
			  {question.question.split('_______').map((part, index, array) => (
				<span key={index}>
				  {part}
				  {index < array.length - 1 && (
					<input
					  type="text"
					  value={fillBlanks[index] || ''}
					  onChange={(e) => handleBlankChange(index, e.target.value)}
					  disabled={disabled}
					  className="mx-2 px-3 py-1 border-b-2 border-amber-300 bg-transparent focus:border-amber-600 outline-none text-amber-700 font-semibold min-w-[120px] disabled:bg-slate-50"
					  placeholder={`Blank ${index + 1}`}
					/>
				  )}
				</span>
			  ))}
			</div>
			
			{/* Show submit button only if immediate feedback is ON */}
			{immediateFeedback && !disabled && (
			  <button
				onClick={handleFillBlankSubmit}
				disabled={!fillBlanks.every(blank => blank.trim())}
				className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			  >
				Submit Answer
			  </button>
			)}
			
			{!immediateFeedback && selectedAnswer && (
			  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<p className="text-blue-800 font-medium">✓ Answer recorded</p>
				<p className="text-blue-700 text-sm mt-1">Will be evaluated at quiz completion</p>
			  </div>
			)}
			
			{showResult && immediateFeedback && (
			  <div className={`border rounded-lg p-4 ${
				selectedAnswer?.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
			  }`}>
				<p className={selectedAnswer?.isCorrect ? 'text-green-800' : 'text-red-800'}>
				  {selectedAnswer?.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
				</p>
			  </div>
			)}
		  </div>
		);
    default:
      return <div>Unsupported question type: {question.type}</div>;
  }
};

export default QuestionTypeRenderer;