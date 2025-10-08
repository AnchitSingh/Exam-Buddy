import React, { useState, useEffect, useRef } from 'react';
import GlobalHeader from '../components/ui/GlobalHeader';
import BackgroundEffects from '../components/ui/BackgroundEffects';
import Modal from '../components/ui/Modal';
import examBuddyAPI from '../services/api';
import { extractFromCurrentPage, extractFromPDFResult, normalizeManualTopic } from '../utils/contentExtractor';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { SOURCE_TYPE } from '../utils/messages';



const QuizResultsPage = ({ results, onNavigate }) => {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [showMobileNav, setShowMobileNav] = useState(false);
	const [isSolutionsModalOpen, setSolutionsModalOpen] = useState(false);
	const [aiOverallFeedback, setAiOverallFeedback] = useState('');
	const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
	const feedbackFetched = useRef(false);
	const [recommendedTopics, setRecommendedTopics] = useState([]);


	useEffect(() => {
		if (!results || feedbackFetched.current) return;

		feedbackFetched.current = true;
		let isActive = true;
		const generateFeedback = async () => {
			const { quiz, answers, config, score, totalQuestions, timeSpent } = results;
			const quizMeta = {
				title: quiz.title,
				subject: config.subject,
				difficulty: config.difficulty,
			};

			const stats = {
				total_questions: totalQuestions,
				total_correct: score,
				overall_accuracy: totalQuestions > 0 ? score / totalQuestions : 0,
				average_time_sec: answers.length > 0 ? timeSpent / answers.length : 0,
				examples: answers.slice(0, 5).map((ans, i) => ({
					type: quiz.questions[i].type,
					topic: quiz.questions[i].topic || quizMeta.subject,
					difficulty: quiz.questions[i].difficulty,
					text: quiz.questions[i].question,
					was_correct: ans.isCorrect,
				}))
			};

			// Fetch streaming feedback
			try {
				setIsFeedbackLoading(true);
				const stream = await examBuddyAPI.streamQuizFeedback(quizMeta, stats);
				for await (const chunk of stream) {
					if (isActive) {
						setAiOverallFeedback(prev => prev + chunk);
					}
				}
			} catch (error) {
				if (isActive) setAiOverallFeedback("Sorry, an error occurred while generating feedback.");
			} finally {
				if (isActive) setIsFeedbackLoading(false);
			}

		};

		generateFeedback();

		return () => {
			isActive = false;
		};
	}, [results]);

	// Fetch recommended topics
	useEffect(() => {
		if (!results) return;

		let mounted = true;

		const fetchRecommendedTopics = async () => {
			try {
				const statsResponse = await examBuddyAPI.getGlobalStats('all');

				if (!mounted) return;

				if (statsResponse.success && statsResponse.data) {
					const { topicPerformance } = statsResponse.data;

					// Determine order of recommendations: weak -> moderate -> strong
					let topicsToRecommend = [];

					// First, add weak topics
					if (topicPerformance.weak && topicPerformance.weak.length > 0) {
						topicsToRecommend = [...topicPerformance.weak];
					}
					// If no weak topics, add moderate topics
					else if (topicPerformance.moderate && topicPerformance.moderate.length > 0) {
						topicsToRecommend = [...topicPerformance.moderate];
					}
					// If neither weak nor moderate, add strong topics
					else if (topicPerformance.strong && topicPerformance.strong.length > 0) {
						topicsToRecommend = [...topicPerformance.strong];
					}

					// Limit to top 3 topics
					setRecommendedTopics(topicsToRecommend.slice(0, 3).map(topic => topic.name));
				} else {
					// Fallback to empty array if stats not available
					setRecommendedTopics([]);
				}
			} catch (err) {
				console.error('Error fetching recommended topics:', err);
				if (mounted) {
					// Set empty recommendations if API fails
					setRecommendedTopics([]);
				}
			}
		};

		fetchRecommendedTopics();
		return () => { mounted = false; };
	}, [results]);

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



	const renderSubjectiveAnswer = (question, answer) => {
		const textAnswer = answer?.textAnswer;

		if (!textAnswer) {
			return <p className="text-slate-800 font-medium">No answer provided</p>;
		}

		if (Array.isArray(textAnswer)) { // Fill in the Blank
			const parts = question.question.split(/(_{3,})/);
			let blankIndex = 0;
			const userAnswerSentence = parts.map((part) => {
				if (/_{3,}/.test(part)) {
					const blank = textAnswer[blankIndex] ? `<strong class="text-amber-700 font-semibold">${textAnswer[blankIndex]}</strong>` : '_______';
					blankIndex++;
					return blank;
				}
				return part;
			}).join('');

			const correctAnswer = question.acceptableAnswers?.[0];
			let correctAnswerSentence = '';
			if (!answer.isCorrect && correctAnswer) {
				blankIndex = 0;
				correctAnswerSentence = parts.map((part) => {
					if (/_{3,}/.test(part)) {
						const blank = correctAnswer[blankIndex] ? `<strong class="text-green-700 font-semibold">${correctAnswer[blankIndex]}</strong>` : '_______';
						blankIndex++;
						return blank;
					}
					return part;
				}).join('');
			}

			return (
				<div className="space-y-3">
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
			<div className="space-y-3">
				<div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl p-3">
					<p className="text-sm text-slate-600 mb-1">Your answer:</p>
					<p className="text-slate-800 font-medium break-words">{textAnswer}</p>
				</div>
				{answer?.aiEvaluated && (
					<div className={`p-3 rounded-lg border ${answer.isCorrect ? 'bg-green-50/80 border-green-200/50' : 'bg-red-50/80 border-red-200/50'
						}`}>
						<p className={`text-sm font-semibold mb-1 ${answer.isCorrect ? 'text-green-800' : 'text-red-800'
							}`}>
							✨ AI Evaluation: {answer.feedback?.message || (answer.isCorrect ? 'Correct' : 'Incorrect')}
						</p>
						<p className={`text-sm ${answer.isCorrect ? 'text-green-700' : 'text-red-700'
							}`}>
							{answer.feedback?.explanation || answer.explanation}
						</p>
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
						<div className="w-full max-w-lg space-y-6 gap-12 flex flex-col h-full justify-center">
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
							{/* Recommended Topics */}
							<div className="text-center" title="Recommended topics">
								
								<div className="flex flex-wrap justify-center gap-3">
									{recommendedTopics.length > 0 ? (
										recommendedTopics.map((topic, index) => (
											<button
												key={topic}
												onClick={() => {
													onNavigate('home', { openQuizSetup: true, recommendedTopic: topic });
												}}
												className="topic-pill group relative px-5 py-2.5 rounded-xl  backdrop-blur-sm hover:border-amber-400/60 transition-all duration-300 overflow-hidden animate-fade-in-up hover:shadow-lg hover:shadow-amber-200/50"
												style={{ animationDelay: `${0.5 + index * 0.1}s` }}
												aria-label={`Start quiz about ${topic}`}
											>
												{/* Shimmer effect on hover */}
												<div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

												{/* Content */}
												<span className="relative text-sm font-semibold text-slate-700 group-hover:text-amber-800 transition-colors inline-flex items-center gap-2">
													<span className="relative">
														{topic}
														{/* Underline effect */}
														<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
													</span>
													<svg className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
													</svg>
												</span>

												{/* Glow effect on hover */}
												<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/0 via-amber-400/0 to-orange-400/0 group-hover:from-amber-400/20 group-hover:via-orange-400/20 group-hover:to-amber-400/20 transition-all duration-300 -z-10"></div>
											</button>
										))
									) : (
										<p className="text-slate-500 text-sm italic px-4 py-2">
											Complete more quizzes to get personalized topic recommendations!
										</p>
									)}
								</div>
							</div>

							<button onClick={() => setSolutionsModalOpen(true)} className="w-full relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-amber-200/50 hover:border-amber-300 text-lg font-semibold text-slate-800 hover:shadow-xl hover:shadow-amber-100/30 transform hover:-translate-y-0.5 transition-all duration-300 group">
								<span className="flex items-center justify-center">
									<svg
										className="w-5 h-5 mr-2 text-amber-600 group-hover:scale-110 transition-transform duration-300"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									View Question Solutions
								</span>
							</button>

						</div>
					</div>

					{/* Right Side - Scrollable */}
					<div className="w-1/2 flex-shrink-0 overflow-y-auto p-8">
						<div>
							<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
								<h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
									<svg className="w-6 h-6 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
									Overall AI Feedback
								</h2>
								<div className="text-slate-600 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
									{aiOverallFeedback}
									{isFeedbackLoading && (
										<span className="inline-block w-2 h-4 bg-slate-600 animate-pulse ml-1"></span>
									)}
								</div>
							</div>




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

					{/* Recommended Topics - Mobile */}
					<div className="text-center">
						<div className="flex flex-wrap justify-center gap-2">
							{recommendedTopics.length > 0 ? (
								recommendedTopics.map((topic, index) => (
									<button
										key={topic}
										onClick={() => {
											onNavigate('home', { openQuizSetup: true, recommendedTopic: topic });
										}}
										className="topic-pill group relative px-4 py-2 rounded-lg  backdrop-blur-sm hover:border-amber-400/60 transition-all duration-300 overflow-hidden hover:shadow-md hover:shadow-amber-200/50 active:scale-95"
										aria-label={`Start quiz about ${topic}`}
									>
										{/* Shimmer effect on hover */}
										<div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

										{/* Content */}
										<span className="relative text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-amber-800 transition-colors inline-flex items-center gap-1.5">
											<span className="relative">
												{topic}
												{/* Underline effect */}
												<span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
											</span>
											<svg className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
											</svg>
										</span>

										{/* Glow effect on hover */}
										<div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400/0 via-amber-400/0 to-orange-400/0 group-hover:from-amber-400/20 group-hover:via-orange-400/20 group-hover:to-amber-400/20 transition-all duration-300 -z-10"></div>
									</button>
								))
							) : (
								<p className="text-slate-500 text-xs sm:text-sm italic px-4 py-2">
									Complete more quizzes to get personalized topic recommendations!
								</p>
							)}
						</div>
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

					{/* AI Feedback - Mobile */}
					<div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/50">
						<h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 flex items-center">
							<svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							AI Feedback
						</h2>
						<div className="text-sm sm:text-base text-slate-600 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
							{aiOverallFeedback}
							{isFeedbackLoading && (
								<span className="inline-block w-2 h-4 bg-slate-600 animate-pulse ml-1"></span>
							)}
						</div>
					</div>



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
										className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 flex-shrink-0 ${isActive
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
									<div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentAnswer?.unanswered ? 'bg-slate-200 text-slate-600' :
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
											<strong>Correct Answer:</strong> {currentQuestion.answer}
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
							{currentQuestion.answer && !currentAnswer?.unanswered && (
								<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
									<p className="text-sm font-semibold text-blue-800 mb-1">Answer</p>
									<p className="text-sm text-blue-700 break-words">{currentQuestion.answer}</p>
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
	
	@keyframes fadeInUp {
		0% { 
			opacity: 0; 
			transform: translateY(20px); 
		}
		100% { 
			opacity: 1; 
			transform: translateY(0); 
		}
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
	
	.animate-fade-in-up {
		animation: fadeInUp 0.8s ease-out both;
	}
	
	/* Topic Pills Enhanced Hover Effect */
	.topic-pill {
		transform: translateY(0);
	}
	
	.topic-pill:hover {
		transform: translateY(-2px) scale(1.02);
	}
	
	.topic-pill:active {
		transform: translateY(0) scale(0.98);
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