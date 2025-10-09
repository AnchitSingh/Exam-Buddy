# Exam Buddy - AI-Powered Study Companion

Transform any webpage into interactive quizzes using Chrome's built-in AI. Exam Buddy makes learning more effective, engaging, and accessible by turning passive reading into active practice.

## 🌟 Features

### 📝 Interactive Quiz Generation
- **Right-click integration**: Select any text and instantly create a quiz
- **Multiple question types**: MCQ, True/False, Fill-in-the-Blank, and Short Answer
- **Customizable settings**: Adjust difficulty, question count, and time limits
- **Immediate feedback**: Get instant responses with explanations

### 🧠 AI-Powered Learning
- **Local AI processing**: Uses Chrome's built-in Gemini Nano model (no data leaves your device)
- **Subjective answer evaluation**: AI grades open-ended responses with detailed feedback
- **Personalized recommendations**: AI-generated study suggestions based on performance

### 📚 Story Mode
- **Narrative explanations**: Get complex topics explained as engaging stories
- **Multiple styles**: Choose from Grandpa, Simple Words, Deep Dive, or ELI5 formats
- **Various sources**: Create stories from web pages, PDFs, or selected text

### 📊 Progress Tracking
- **Quiz management**: Start, pause, resume, and bookmark quizzes
- **Detailed analytics**: Performance insights and completion statistics
- **Results page**: Comprehensive review with AI-generated feedback

## 🚀 Getting Started

### Prerequisites
- Google Chrome (version 117+ with Chrome AI enabled)
- Enable Chrome AI in chrome://flags (if required)

### Installation
1. Clone this repository:
```bash
git clone https://github.com/yourusername/exam-buddy-extension.git
```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable "Developer mode" in the top-right corner

4. Click "Load unpacked" and select the project directory

5. Pin the extension to your toolbar for easy access

### How to Use

#### Creating a Quiz
1. Navigate to any webpage with content you want to study
2. Select the text you want to quiz yourself on
3. Right-click and choose "Start Quiz with Exam Buddy"
4. Configure your quiz settings (difficulty, number of questions, time limits)
5. Begin practicing!

#### Using Story Mode
1. Select text on any webpage
2. Right-click and choose "Explain using Exam Buddy"
3. Choose a storytelling style (Grandpa, Simple Words, etc.)
4. Read the AI-generated narrative explanation

#### Quick Access
- Click the extension icon to open the side panel
- Create quizzes from open tabs, PDF files, or custom topics
- Access your bookmarks and paused quizzes

## 🛠️ Technical Architecture

### Core Components
- **React 19** for modern UI components
- **Chrome Extension Manifest V3** for browser integration
- **Tailwind CSS** for responsive design
- **Chrome's LanguageModel API** for local AI processing
- **PDF.js** for PDF content extraction

### AI Integration
- Uses Chrome's built-in Gemini Nano model for local processing
- No data leaves your device - complete privacy
- Supports streaming responses for real-time content generation
- Handles multiple content types and question formats

### Content Extraction
- Web page content extraction using Readability API
- PDF text extraction with pdfjs-dist
- Selection-based extraction from any webpage
- Content chunking and summarization for large documents

## 🎯 Learning Benefits

### Active Learning
- Converts passive reading to active engagement
- Immediate practice reinforces memory retention
- Gamification elements increase motivation

### Personalized Experience
- AI adapts to your learning style and pace
- Customizable difficulty and question types
- Performance-based recommendations

### Accessibility
- Works with any web content or PDF
- Multiple explanation styles for different learning preferences
- No server dependencies - works offline

## 📋 Supported Content Sources

1. **Web Pages**: Extract content from any webpage
2. **PDF Files**: Upload and quiz from PDF documents
3. **Text Selection**: Quiz from selected text on any page
4. **Custom Topics**: Create quizzes on any subject

## 🧩 Content Extraction Methods

- **DOM Content**: Extracts clean text from web pages
- **Readable Content**: Uses Readability algorithm to filter out noise
- **Selection Text**: Gets currently highlighted text
- **PDF Processing**: Extracts text from PDF files client-side

## 📊 Question Types

### MCQ (Multiple Choice Questions)
- 4 options with one correct answer
- Detailed explanations for all choices

### True/False
- Binary choice questions
- Clear reasoning for correct answers

### Fill-in-the-Blank
- Context-based blank filling
- Accepts variations of correct answers

### Short Answer
- Open-ended questions requiring detailed responses
- AI-evaluated with personalized feedback

## 🔒 Privacy & Security

- **Local Processing**: All AI processing happens on-device
- **No Data Collection**: No personal data is stored or transmitted
- **Secure API**: Uses Chrome's secure AI APIs
- **Content Isolation**: Content stays within the extension context

## 📈 Performance Tracking

### Quiz Results
- Accuracy percentages
- Time spent per question
- Performance by question type
- Topic-based breakdown

### Analytics
- Progress over time
- Strengths and weaknesses identification
- Improvement recommendations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Issues

If you encounter any problems or have feature requests, please [open an issue](https://github.com/yourusername/exam-buddy-extension/issues) on GitHub.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Chrome's AI capabilities for local processing
- Uses PDF.js for client-side PDF processing
- React ecosystem for modern UI development

---

Made with ❤️ and the power of Chrome's built-in AI.

**Transform your browser into your personal study companion with Exam Buddy!**