import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { extractFromCurrentPage, extractFromPDFResult, normalizeManualTopic } from '../utils/contentExtractor';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { SOURCE_TYPE } from '../utils/messages';
import examBuddyAPI from '../services/api';
import BackgroundEffects from '../components/ui/BackgroundEffects';

const LoadingProgress = ({ steps, currentStep, streamMessage }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-white/50">
        <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Preparing Your Quiz</h3>
                <p className="text-slate-500 text-sm mt-1">Please wait while we work our magic...</p>
            </div>
            
            <div className="space-y-4">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    
                    return (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-slate-50/50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                isCompleted 
                                ? 'bg-green-100 border-2 border-green-500' 
                                : isCurrent 
                                    ? 'bg-amber-100 border-2 border-amber-500' 
                                    : 'bg-slate-100 border-2 border-slate-300'
                            }`}>
                                {isCompleted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#75c520" fill="none">
                                <path d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10" stroke="#75c520" strokeWidth="1.5" strokeLinecap="round"></path>
                                <path d="M8 12.5C8 12.5 9.5 12.5 11.5 16C11.5 16 17.0588 6.83333 22 5" stroke="#75c520" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                            ) : isCurrent ? (
                                <svg className="animate-spin w-5 h-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                ) : (
                                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold transition-colors ${
                                isCompleted ? 'text-green-800' : 
                                isCurrent ? 'text-amber-800' : 'text-slate-600'
                                }`}>
                                {step.title}
                                {isCurrent && streamMessage && <span className="ml-2 font-normal text-amber-700">{streamMessage}</span>}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

const QuizLoadingPage = ({ onNavigate, navigationData }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [streamMessage, setStreamMessage] = useState('');
    const { config } = navigationData || {};

    const steps = [
        { title: 'Analyzing Content Source' },
        { title: 'Extracting Key Information' },
        { title: 'Generating Questions with AI' },
    ];

    useEffect(() => {
        if (!config) {
            toast.error("No quiz configuration found.");
            onNavigate('home');
            return;
        }

        const handleStreamProgress = (progress) => {
            if (progress.status === 'streaming') {
                setStreamMessage(`(Received ${progress.receivedChunks} data chunks...)`);
            }
        };

        const generate = async () => {
            let extractedSource;
            try {
                // Step 1: Analyzing
                setCurrentStep(0);
                await new Promise(res => setTimeout(res, 500)); // visual delay

                // Step 2: Extracting
                setCurrentStep(1);
                switch (config.sourceType) {
                    case SOURCE_TYPE.PAGE:
                        // Check if the selected tab is a PDF
                        if (config.selectedTab && config.selectedTab.url && config.selectedTab.url.toLowerCase().endsWith('.pdf')) {
                            // Create a progress callback for this extraction
                            const progressCallback = (progress) => {
                                setStreamMessage(progress.message || '');
                            };
                            
                            try {
                                console.log('Extracting PDF from tab URL:', config.selectedTab.url);
                                const { text, meta } = await extractTextFromPDF(config.selectedTab.url);
                                extractedSource = await extractFromPDFResult({
                                    text,
                                    fileName: config.selectedTab.url.split('/').pop() || 'PDF Document',
                                    pageCount: meta.pageCount
                                }, config, progressCallback);
                                console.log('PDF extraction from tab completed successfully');
                            } catch (error) {
                                console.error('Failed to extract PDF from tab URL:', error);
                                // If PDF extraction fails, fall back to normal page extraction
                                extractedSource = await extractFromCurrentPage(config);
                            }
                        } else {
                            extractedSource = await extractFromCurrentPage(config);
                        }
                        break;
                    case SOURCE_TYPE.PDF:
                        if (config.pdfFile) {
                            const { text, meta } = await extractTextFromPDF(config.pdfFile);
                            extractedSource = await extractFromPDFResult({
                                text,
                                fileName: config.pdfFile.name,
                                pageCount: meta.pageCount
                            });
                        }
                        break;
                    case SOURCE_TYPE.URL:
                        // Check if the URL is a PDF file
                        if (config.sourceValue && config.sourceValue.toLowerCase().endsWith('.pdf')) {
                            // Create a progress callback for this extraction
                            const progressCallback = (progress) => {
                                setStreamMessage(progress.message || '');
                            };
                            
                            // Treat it as a PDF URL and extract content
                            try {
                                console.log('Extracting PDF from URL:', config.sourceValue);
                                const { text, meta } = await extractTextFromPDF(config.sourceValue);
                                extractedSource = await extractFromPDFResult({
                                    text,
                                    fileName: config.sourceValue.split('/').pop() || 'PDF Document',
                                    pageCount: meta.pageCount
                                }, config, progressCallback);
                                console.log('PDF extraction from URL completed successfully');
                            } catch (error) {
                                console.error('Failed to extract PDF from URL:', error);
                                // If PDF extraction fails, fall back to treating it as a regular URL
                                extractedSource = normalizeManualTopic(config.sourceValue, `Content from ${config.sourceValue}`);
                            }
                        } else {
                            extractedSource = normalizeManualTopic(config.sourceValue, `Content from ${config.sourceValue}`);
                        }
                        break;
                    case SOURCE_TYPE.MANUAL:
                    default:
                        extractedSource = normalizeManualTopic(config.topic, config.context);
                        break;
                }

                if (!extractedSource || !extractedSource.text) {
                    throw new Error("Could not extract any content from the source.");
                }
                
                // Step 3: Generating Questions
                setCurrentStep(2);
                
                const finalQuizConfig = {
                    ...config,
                    extractedSource,
                    topic: config.topic || extractedSource.title,
                };

                const response = await examBuddyAPI.generateQuiz(finalQuizConfig, handleStreamProgress);

                if (!response.success) {
                    throw new Error(response.error || "Failed to generate quiz questions.");
                }

                // Navigate with the final, generated quiz data
                onNavigate('quiz', { quizConfig: { quizData: response.data } });

            } catch (error) {
                console.error('Failed to prepare quiz:', error);
                toast.error(`Error: ${error.message}`);
                onNavigate('home');
            }
        };

        generate();
    }, [config, onNavigate]);

    return (
        <div className="antialiased bg-gradient-to-br from-slate-50 via-white to-amber-50/30 text-slate-900 min-h-screen flex items-center justify-center p-4">
            <BackgroundEffects />
            <LoadingProgress steps={steps} currentStep={currentStep} streamMessage={streamMessage} />
        </div>
    );
};

export default QuizLoadingPage;