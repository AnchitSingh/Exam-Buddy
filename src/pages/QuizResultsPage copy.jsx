import React, { useState } from 'react';
import GlobalHeader from '../components/ui/GlobalHeader';
import BackgroundEffects from '../components/ui/BackgroundEffects';
import Modal from '../components/ui/Modal';

const QuizResultsPage = ({ results, onNavigate }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [showMobileNav, setShowMobileNav] = useState(false);
	const [isSolutionsModalOpen, setSolutionsModalOpen] = useState(false);

	if (!results) {
		return (
			<div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
								<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
							</svg>
						</div>
						<p className="text-slate-600 mb-4">No results available</p>
					</div>
				</div>
			</div>
		);
	}

	const { score, totalQuestions, answers, timeSpent, config } = results;
	const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
	const answeredCount = (answers || []).filter(a => a != null && !a.unanswered).length;
	const unansweredCount = totalQuestions - answeredCount;
	const incorrectCount = answeredCount - score;
	
	
	// Calculate performance level - always use amber/orange gradient for uniform appearance
	const getPerformanceLevel = () => {
		// Always use the amber to orange gradient for consistent appearance
		const uniformGradient = "from-amber-500 to-orange-500";
		
		if (percentage >= 90) return { text: "Outstanding!", color: uniformGradient };
		if (percentage >= 75) return { text: "Great job!", color: uniformGradient };
		if (percentage >= 60) return { text: "Good effort!", color: uniformGradient };
		return { text: "Keep practicing!", color: uniformGradient };
	};

	const performance = getPerformanceLevel();

	const formatTime = (seconds) => {
		if (typeof seconds === 'string') return seconds;
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Generate AI-like feedback based on performance
	const generateAIFeedback = () => {
		const correctPercentage = percentage;
		let feedback = "";

		if (correctPercentage >= 90) {
			feedback = "Excellent performance! You demonstrated strong mastery of the subject matter with consistent accuracy across all question types. Your understanding is comprehensive and you're ready for more advanced challenges.";
		} else if (correctPercentage >= 75) {
			feedback = "Great work! You showed solid understanding with room for minor improvements in specific areas. Focus on the concepts you missed to achieve even better results.";
		} else if (correctPercentage >= 60) {
			feedback = "Good effort! You have a foundation to build upon. Focus on strengthening key concepts for better results. Review the questions you missed and practice similar problems.";
		} else {
			feedback = "Keep practicing! This is a learning opportunity. Focus on understanding core concepts and practice regularly. Don't be discouraged - every expert was once a beginner.";
		}

		return feedback;
	};

	const aiFeedback = generateAIFeedback();

	const recommendedQuizzes = [
		{
			id: 'rec1',
			title: 'Review Incorrect',
			reason: 'Focus on missed questions',
			difficulty: 'Custom',
			icon: '🎯'
		},
		{
			id: 'rec2',
			title: 'Related Topics',
			reason: 'Broaden knowledge',
			difficulty: 'Medium',
			icon: '📚'
		},
		{
			id: 'rec3',
			title: 'Challenge Mode',
			reason: 'Try harder quiz',
			difficulty: 'Hard',
			icon: '🔥'
		},
		{
			id: 'rec4',
			title: 'Speed Practice',
			reason: 'Improve timing',
			difficulty: 'Medium',
			icon: '⚡'
		},
		{
			id: 'rec5',
			title: 'Concept Review',
			reason: 'Strengthen basics',
			difficulty: 'Easy',
			icon: '💡'
		}
	];

	const renderSubjectiveAnswer = (question, answer) => {
		const textAnswer = answer?.textAnswer;

		if (!textAnswer) {
			return <p className="text-slate-800 font-medium">No answer provided</p>;
		}

		if (Array.isArray(textAnswer)) { // Fill in the Blank
			const parts = question.question.split('_______');
			const userAnswerSentence = parts.reduce((acc, part, i) => {
				const blank = textAnswer[i] ? `<strong class="text-amber-700 font-semibold">${textAnswer[i]}</strong>` : '_______';
				return acc + part + (i < parts.length - 1 ? blank : '');
			}, '');

			const correctAnswer = question.acceptableAnswers?.[0];
			let correctAnswerSentence = '';
			if (!answer.isCorrect && correctAnswer) {
				correctAnswerSentence = parts.reduce((acc, part, i) => {
					const blank = correctAnswer[i] ? `<strong class="text-green-700 font-semibold">${correctAnswer[i]}</strong>` : '_______';
					return acc + part + (i < parts.length - 1 ? blank : '');
				}, '');
			}

			return (
				<div>
					<div className="mb-3 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl p-3">
						<p className="text-sm text-slate-600 mb-1">Your answer:</p>
						<p className="text-slate-800 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: userAnswerSentence }} />
					</div>
					{correctAnswerSentence && (
						<div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl p-3">
							<p className="text-sm text-green-800 mb-1">Correct answer:</p>
							<p className="text-green-900 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: correctAnswerSentence }} />
						</div>
					)}
				</div>
			);
		}

		// Short Answer
		return (
			<div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl p-3">
				<p className="text-sm text-slate-600 mb-1">Your answer:</p>
				<p className="text-slate-800 font-medium break-words">{textAnswer}</p>
				{answer?.aiEvaluated && (
					<div className="mt-2 text-xs text-purple-600">
						✨ Evaluated by AI
					</div>
				)}
			</div>
		);
	};

	// Get current question for solutions view
	const currentQuestion = results.quiz?.questions?.[currentQuestionIndex] || null;
	const currentAnswer = answers?.[currentQuestionIndex] || null;

	return (
		<div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen">
			<BackgroundEffects />

			{/* Header */}
			<GlobalHeader currentPage="" onNavigate={onNavigate} />

			{/* Main Content - Two Part Layout */}
			<main className="relative">
				{/* Desktop Layout */}
				<div className="hidden lg:flex h-screen pt-24">
					{/* Left Side - Fixed */}
					<div className="w-1/2 flex-shrink-0 flex items-center justify-center p-8">
						<div className="w-full max-w-lg space-y-6">
							{/* Score Circle */}
							<div className="flex flex-col items-center">
								<div className="relative inline-flex items-center justify-center mb-6">
									<div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-2xl animate-pulse-slow"></div>
									
									<div className="relative bg-white rounded-full w-48 h-48 shadow-2xl flex flex-col items-center justify-center border border-amber-100/50">
										<div className={`text-6xl font-bold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent animate-scale-in`}>
											{percentage}%
										</div>
										<p className="text-slate-500 text-sm mt-1">{score}/{totalQuestions} correct</p>
									</div>

									{/* Decorative Ring - Always amber/orange gradient */}
									<svg className="absolute inset-0 w-48 h-48 animate-rotate-slow">
										<circle
											cx="96"
											cy="96"
											r="94"
											stroke="url(#gradient)"
											strokeWidth="2"
											fill="none"
											strokeDasharray={`${percentage * 5.9} 590`}
											strokeLinecap="round"
											className="transform -rotate-90 origin-center"
										/>
										<defs>
											<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" stopColor="#f59e0b" />
												<stop offset="100%" stopColor="#ea580c" />
											</linearGradient>
										</defs>
									</svg>
								</div>
								
								<h2 className="text-3xl font-bold">
									<span className={`bg-gradient-to-r ${performance.color} bg-clip-text text-transparent`}>
										{performance.text}
									</span>
								</h2>
								{config?.timerEnabled ? (
									<p className="text-lg text-slate-600">You've completed the quiz in {formatTime(timeSpent)}</p>
								) : (
									<p className="text-lg text-slate-600">Quiz completed successfully</p>
								)}
							</div>

							{/* Quick Stats */}
							<div className="grid grid-cols-4 gap-2">
								<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
									<div className="text-xl font-bold text-green-600">{score}</div>
									<p className="text-xs text-slate-500 mt-1">Correct</p>
								</div>
								<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
									<div className="text-xl font-bold text-red-600">{incorrectCount}</div>
									<p className="text-xs text-slate-500 mt-1">Incorrect</p>
								</div>
								<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
									<div className="text-xl font-bold text-slate-400">{unansweredCount}</div>
									<p className="text-xs text-slate-500 mt-1">Skipped</p>
								</div>
								{config?.timerEnabled ? (
									<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
										<div className="text-xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
										<p className="text-xs text-slate-500 mt-1">Time</p>
									</div>
								) : (
									<div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/50 hover:scale-105 transition-transform duration-300">
										<div className="text-xl font-bold text-blue-600">-</div>
										<p className="text-xs text-slate-500 mt-1">No Timer</p>
									</div>
								)}
							</div>

							{/* Recommendations Carousel */}
							<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
								<h3 className="text-lg font-semibold text-slate-800 mb-4">Recommended for You</h3>
								<div className="overflow-x-auto pb-2">
									<div className="flex space-x-4 min-w-max">
										{recommendedQuizzes.map((quiz) => (
											<button
												key={quiz.id}
												onClick={() => onNavigate('setup')}
												className="flex-shrink-0 w-40 bg-gradient-to-br from-white to-amber-50/30 rounded-xl p-3 border border-amber-200/50 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 text-left group"
											>
												<div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{quiz.icon}</div>
												<h4 className="font-semibold text-slate-800 text-sm mb-1">{quiz.title}</h4>
												<p className="text-xs text-slate-600 mb-2">{quiz.reason}</p>
												<span className="inline-block px-2 py-0.5 text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-md font-medium">
													{quiz.difficulty}
												</span>
											</button>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Side - Scrollable */}
					<div className="w-1/2 flex-shrink-0 overflow-y-auto p-8">
						<div className="max-w-2xl mx-auto space-y-6">
							{/* AI Feedback Section */}
							<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
								<h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
									<svg className="w-6 h-6 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
									AI Feedback
								</h2>
								<p className="text-slate-600 leading-relaxed">
									{aiFeedback}
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4">
								<button
									onClick={() => onNavigate('setup')}
									className="flex-1 relative bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-amber-200/50 transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
								>
									<span className="relative z-10">Take New Quiz</span>
									<div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</button>
								<button
									onClick={() => onNavigate('story')}
									className="flex-1 relative bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-purple-200/50 transform hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
								>
									<span className="relative z-10">Story Mode</span>
									<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</button>
							</div>

							{/* View Solutions Button */}
							<button
								onClick={() => setSolutionsModalOpen(true)}
								className="w-full relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-amber-200/50 hover:border-amber-300 text-lg font-semibold text-slate-800 hover:shadow-xl hover:shadow-amber-100/30 transform hover:-translate-y-0.5 transition-all duration-300 group"
							>
								<span className="flex items-center justify-center">
									<svg className="w-5 h-5 mr-2 text-amber-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									View Question Solutions
								</span>
							</button>
						</div>
					</div>
				</div>

				{/* Mobile/Tablet Layout */}
				<div className="lg:hidden px-4 sm:px-6 pb-6 pt-24 space-y-6">
					{/* Score Circle - Mobile */}
					<div className="flex flex-col items-center">
						<div className="relative inline-flex items-center justify-center mb-4">
							<div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-xl animate-pulse-slow"></div>
							
							<div className="relative bg-white rounded-full w-36 h-36 sm:w-44 sm:h-44 shadow-xl flex flex-col items-center justify-center border border-amber-100/50">
								<div className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${performance.color} bg-clip-text text-transparent`}>
									{percentage}%
								</div>
								<p className="text-slate-500 text-xs sm:text-sm mt-1">{score}/{totalQuestions} correct</p>
							</div>

							{/* Decorative Ring - Always amber/orange gradient */}
							<svg className="absolute inset-0 w-36 h-36 sm:w-44 sm:h-44 animate-rotate-slow">
								<circle
									cx="72"
									cy="72"
									r="70"
									stroke="url(#gradient-mobile)"
									strokeWidth="2"
									fill="none"
									strokeDasharray={`${percentage * 4.4} 440`}
									strokeLinecap="round"
									className="transform -rotate-90 origin-center sm:hidden"
								/>
								<circle
									cx="88"
									cy="88"
									r="86"
									stroke="url(#gradient-mobile)"
									strokeWidth="2"
									fill="none"
									strokeDasharray={`${percentage * 5.4} 540`}
									strokeLinecap="round"
									className="transform -rotate-90 origin-center hidden sm:block"
								/>
								<defs>
									<linearGradient id="gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
										<stop offset="0%" stopColor="#f59e0b" />
										<stop offset="100%" stopColor="#ea580c" />
									</linearGradient>
								</defs>
							</svg>
						</div>
						
						<h2 className="text-2xl sm:text-3xl font-bold text-center">
							<span className={`bg-gradient-to-r ${performance.color} bg-clip-text text-transparent`}>
								{performance.text}
							</span>
						</h2>
						{config?.timerEnabled ? (
							<p className="text-sm sm:text-base text-slate-600 text-center">You've completed the quiz in {formatTime(timeSpent)}</p>
						) : (
							<p className="text-sm sm:text-base text-slate-600 text-center">Quiz completed successfully</p>
						)}
					</div>

					{/* Quick Stats - Mobile */}
					<div className="grid grid-cols-4 gap-2">
						<div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-white/50">
							<div className="text-lg sm:text-xl font-bold text-green-600">{score}</div>
							<p className="text-xs text-slate-500">Correct</p>
						</div>
						<div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-white/50">
							<div className="text-lg sm:text-xl font-bold text-red-600">{incorrectCount}</div>
							<p className="text-xs text-slate-500">Incorrect</p>
						</div>
						<div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-white/50">
							<div className="text-lg sm:text-xl font-bold text-slate-400">{unansweredCount}</div>
							<p className="text-xs text-slate-500">Skipped</p>
						</div>
						{config?.timerEnabled ? (
							<div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-white/50">
								<div className="text-lg sm:text-xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
								<p className="text-xs text-slate-500">Time</p>
							</div>
						) : (
							<div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center border border-white/50">
								<div className="text-lg sm:text-xl font-bold text-blue-600">-</div>
								<p className="text-xs text-slate-500">No Timer</p>
							</div>
						)}
					</div>

					{/* Recommendations Carousel - Mobile */}
					<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/50">
						<h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Recommended for You</h3>
						<div className="overflow-x-auto pb-2">
							<div className="flex space-x-3 min-w-max">
								{recommendedQuizzes.map((quiz) => (
									<button
										key={quiz.id}
										onClick={() => onNavigate('setup')}
										className="flex-shrink-0 w-32 sm:w-36 bg-gradient-to-br from-white to-amber-50/30 rounded-lg sm:rounded-xl p-3 border border-amber-200/50 hover:border-amber-300 hover:shadow-lg transition-all duration-300 text-left"
									>
										<div className="text-xl sm:text-2xl mb-1.5">{quiz.icon}</div>
										<h4 className="font-semibold text-slate-800 text-xs sm:text-sm mb-1">{quiz.title}</h4>
										<p className="text-xs text-slate-600 mb-1.5">{quiz.reason}</p>
										<span className="inline-block px-1.5 py-0.5 text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded font-medium">
											{quiz.difficulty}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>

					{/* AI Feedback - Mobile */}
					<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/50">
						<h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 flex items-center">
							<svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							AI Feedback
						</h2>
						<p className="text-sm sm:text-base text-slate-600 leading-relaxed">
							{aiFeedback}
						</p>
					</div>

					{/* Action Buttons - Mobile */}
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
						<button
							onClick={() => onNavigate('setup')}
							className="flex-1 relative bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base overflow-hidden group"
						>
							<span className="relative z-10">Take New Quiz</span>
							<div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						</button>
						<button
							onClick={() => onNavigate('story')}
							className="flex-1 relative bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base overflow-hidden group"
						>
							<span className="relative z-10">Story Mode</span>
							<div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						</button>
					</div>

					{/* View Solutions Button - Mobile */}
					<button
						onClick={() => setSolutionsModalOpen(true)}
						className="w-full relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-amber-200/50 hover:border-amber-300 text-base sm:text-lg font-semibold text-slate-800 group"
					>
						<span className="flex items-center justify-center">
							<svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-amber-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							View Question Solutions
						</span>
					</button>
				</div>
			</main>

			<Modal
				isOpen={isSolutionsModalOpen}
				onClose={() => setSolutionsModalOpen(false)}
				title="Question Solutions"
				size="xl"
			>
				<div className="text-left">
					{/* Question Navigator */}
					<div className="mb-4 overflow-x-auto pb-2">
						<div className="flex space-x-2 min-w-max p-4">
							{[...Array(totalQuestions)].map((_, idx) => {
								const answer = answers?.[idx];
								const isActive = idx === currentQuestionIndex;
								const isCorrect = answer?.isCorrect;
								const isUnanswered = answer?.unanswered;

								return (
									<button
										key={idx}
										onClick={() => setCurrentQuestionIndex(idx)}
										className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 flex-shrink-0 ${
											isActive
												? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-110'
												: isUnanswered
													? 'bg-slate-100 text-slate-400 border border-slate-200'
													: isCorrect
														? 'bg-green-100 text-green-700 border border-green-200'
														: 'bg-red-100 text-red-700 border border-red-200'
										}`}
									>
										{idx + 1}
									</button>
								);
							})}
						</div>
					</div>

					{/* Current Question Display */}
					{currentQuestion && (
						<div className="space-y-4 max-w-full overflow-hidden">
							{/* Question */}
							<div className="p-4 bg-slate-50 rounded-xl max-w-full">
								<div className="flex items-start space-x-3 max-w-full">
									<div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
										currentAnswer?.unanswered ? 'bg-slate-200 text-slate-600' :
										currentAnswer?.isCorrect ? 'bg-green-100 text-green-700' :
										'bg-red-100 text-red-700'
									}`}>
										{currentAnswer?.unanswered ? '?' : currentAnswer?.isCorrect ? '✓' : '✗'}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm text-slate-500 mb-1">Question {currentQuestionIndex + 1}</p>
										<p className="text-slate-800 font-medium break-words">{currentQuestion.question}</p>
									</div>
								</div>
							</div>

							{/* Answer Section */}
							{currentAnswer?.unanswered ? (
								<div className="mb-6">
									<div className="p-4 rounded-xl bg-slate-100/60 backdrop-blur-sm text-slate-600 font-medium text-center mb-4 border border-white/50">
										Not Answered
									</div>
									{currentQuestion.type === 'MCQ' || currentQuestion.type === 'True/False' ? (
										<div className="space-y-3">
											{(currentQuestion.options || []).map((option, optionIndex) => {
												const isCorrectOption = option.isCorrect;
												return (
													<div key={optionIndex} className={`flex items-center space-x-3 p-4 rounded-xl backdrop-blur-sm border ${isCorrectOption ? 'bg-green-50/60 border-green-200/50' : 'bg-white/60 border-white/50'
														}`}>
														<span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isCorrectOption ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
															}`}>
															{String.fromCharCode(65 + optionIndex)}
														</span>
														<span className="flex-1 text-slate-700 break-words">{option.text}</span>
														{isCorrectOption && <span className="text-sm font-medium text-green-600">Correct Answer</span>}
													</div>
												);
											})}
										</div>
									) : (
										<div className="p-4 rounded-xl bg-green-50/60 backdrop-blur-sm border border-green-200/50 text-green-800">
											<strong>Correct Answer:</strong> {currentQuestion.explanation}
										</div>
									)}
								</div>
							) : currentQuestion.type === 'Short Answer' || currentQuestion.type === 'Fill in Blank' ? (
								<div className="mb-6">
									{renderSubjectiveAnswer(currentQuestion, currentAnswer)}
								</div>
							) : (
								<div className="space-y-3 mb-6">
									{(currentQuestion.options || []).map((option, optionIndex) => {
										const isSelected = currentAnswer?.selectedOption === optionIndex;
										const isCorrectOption = option.isCorrect;

										return (
											<div key={optionIndex} className={`flex items-center space-x-3 p-4 rounded-xl backdrop-blur-sm border ${isSelected && isCorrectOption ? 'bg-green-100/60 border-green-300/50' :
												isSelected && !isCorrectOption ? 'bg-red-100/60 border-red-300/50' :
													!isSelected && isCorrectOption ? 'bg-green-50/60 border-green-200/50' :
														'bg-white/60 border-white/50'
												}`}>
												<span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isSelected && isCorrectOption ? 'bg-green-200 text-green-800' :
														isSelected && !isCorrectOption ? 'bg-red-200 text-red-800' :
															!isSelected && isCorrectOption ? 'bg-green-100 text-green-700' :
																'bg-slate-100 text-slate-600'
													}`}>
													{String.fromCharCode(65 + optionIndex)}
												</span>
												<span className="flex-1 text-slate-700 break-words">{option.text}</span>
												{isSelected && <span className="text-sm font-medium text-slate-600">Your Answer</span>}
												{!isSelected && isCorrectOption && <span className="text-sm font-medium text-green-600">Correct</span>}
											</div>
										);
									})}
								</div>
							)}

							{/* Explanation */}
							{currentQuestion.explanation && !currentAnswer?.unanswered && (
								<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
									<p className="text-sm font-semibold text-blue-800 mb-1">Explanation</p>
									<p className="text-sm text-blue-700 break-words">{currentQuestion.explanation}</p>
								</div>
							)}
						</div>
					)}
				</div>
			</Modal>

			{/* Custom Styles */}
			<style>{`
				@keyframes fadeIn {
					0% { opacity: 0; }
					100% { opacity: 1; }
				}
				
				@keyframes scaleIn {
					0% { transform: scale(0); }
					50% { transform: scale(1.1); }
					100% { transform: scale(1); }
				}
				
				@keyframes rotateSlow {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
				
				@keyframes pulseSlow {
					0%, 100% { opacity: 0.4; }
					50% { opacity: 0.6; }
				}
				
				.animate-scale-in {
					animation: scaleIn 0.6s ease-out;
				}
				
				.animate-rotate-slow {
					animation: rotateSlow 20s linear infinite;
				}
				
				.animate-pulse-slow {
					animation: pulseSlow 3s ease-in-out infinite;
				}
				
				/* Hide scrollbar but keep functionality */
				.overflow-x-auto::-webkit-scrollbar {
					height: 4px;
				}
				
				.overflow-x-auto::-webkit-scrollbar-track {
					background: #f1f1f1;
					border-radius: 10px;
				}
				
				.overflow-x-auto::-webkit-scrollbar-thumb {
					background: #fbbf24;
					border-radius: 10px;
				}
				
				/* Desktop specific styles */
				@media (min-width: 1024px) {
					.overflow-y-auto::-webkit-scrollbar {
						width: 6px;
					}
					
					.overflow-y-auto::-webkit-scrollbar-track {
						background: #f1f1f1;
						border-radius: 10px;
					}
					
					.overflow-y-auto::-webkit-scrollbar-thumb {
						background: #cbd5e1;
						border-radius: 10px;
					}
					
					.overflow-y-auto::-webkit-scrollbar-thumb:hover {
						background: #94a3b8;
					}
				}
			`}</style>
		</div>
	);
};

export default QuizResultsPage;