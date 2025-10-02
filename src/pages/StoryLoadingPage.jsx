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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Generating Your Story</h3>
                <p className="text-slate-500 text-sm mt-1">Please wait while we craft your narrative...</p>
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

const StoryLoadingPage = ({ onNavigate, navigationData }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [streamMessage, setStreamMessage] = useState('');
    const { config } = navigationData || {};

    const steps = [
        { title: 'Analyzing Content Source' },
        { title: 'Extracting Key Information' },
        { title: 'Crafting Your Story with AI' },
    ];

    useEffect(() => {
        if (!config) {
            toast.error("No story configuration found.");
            onNavigate('home');
            return;
        }

        const handleStreamProgress = (progress) => {
            if (progress.status === 'streaming') {
                setStreamMessage(`(Crafting story...)`);
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
                const progressCallback = (progress) => {
                    setStreamMessage(progress.message || '');
                };
                
                switch (config.sourceType) {
                    case SOURCE_TYPE.PAGE:
                        // Check if the selected tab is a PDF
                        if (config.selectedTab && config.selectedTab.url && config.selectedTab.url.toLowerCase().endsWith('.pdf')) {
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
                                extractedSource = await extractFromCurrentPage(config, progressCallback);
                            }
                        } else {
                            extractedSource = await extractFromCurrentPage(config, progressCallback);
                        }
                        break;
                    case SOURCE_TYPE.PDF:
                        if (config.pdfFile) {
                            const { text, meta } = await extractTextFromPDF(config.pdfFile);
                            extractedSource = await extractFromPDFResult({
                                text,
                                fileName: config.pdfFile.name,
                                pageCount: meta.pageCount
                            }, config, progressCallback);
                        }
                        break;
                    case SOURCE_TYPE.SELECTION:
                    case SOURCE_TYPE.MANUAL:
                    default:
                        extractedSource = normalizeManualTopic(config.topic, config.context, config, progressCallback);
                        break;
                }
                
                // Update stream message to show extraction statistics
                if (extractedSource) {
                    const chunkCount = extractedSource.chunks ? extractedSource.chunks.length : 0;
                    const wordCount = extractedSource.text ? extractedSource.text.split(/\s+/).length : 0;
                    const charCount = extractedSource.text ? extractedSource.text.length : 0;
                    setStreamMessage(`(${chunkCount} chunks, ${wordCount} words, ${charCount} chars)`);
                }

                if (!extractedSource || !extractedSource.text) {
                    throw new Error("Could not extract any content from the source.");
                }
                
                // Step 3: Crafting Story
                setCurrentStep(2);
                
                const finalStoryConfig = {
                    ...config,
                    extractedSource,
                    topic: config.topic || extractedSource.title,
                };

                const response = await examBuddyAPI.generateStory(finalStoryConfig);

                if (!response.success) {
                    throw new Error(response.error || "Failed to generate story.");
                }

                // Stream content in real-time, transitioning to StoryPage only after first chunk
                let storyContent = '';
                let chunkCount = 0;
                let isFirstChunk = true;
                for await (const chunk of response.data) {
                    storyContent += chunk;
                    chunkCount++;
                    setStreamMessage(`(Received ${chunkCount} story segments...)`);
                    
                    if (isFirstChunk) {
                        // Navigate to StoryPage with first chunk of content
                        onNavigate('story', { 
                            storyConfig: finalStoryConfig,
                            storyContent: { 
                                title: finalStoryConfig.topic, 
                                content: storyContent, 
                                style: finalStoryConfig.storyStyle 
                            },
                            isStreaming: true
                        });
                        isFirstChunk = false;
                    } else {
                        // Update content in real-time after first chunk
                        onNavigate('story', { 
                            storyConfig: finalStoryConfig,
                            storyContent: { 
                                title: finalStoryConfig.topic, 
                                content: storyContent, 
                                style: finalStoryConfig.storyStyle 
                            },
                            isStreaming: true
                        });
                    }
                }

                // After all content is streamed, delay slightly before indicating completion
                // This ensures all content updates are processed
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error('Failed to prepare story:', error);
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

export default StoryLoadingPage;