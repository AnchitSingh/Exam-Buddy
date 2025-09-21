class ChromeAI {
    constructor() {
      this.promptSession = null;
      this.summarizerSession = null;
    }
  
    async checkAvailability() {
      if (!window.ai) {
        throw new Error('Chrome AI not available');
      }
      
      const promptAvailable = await window.ai.prompt.capabilities();
      return promptAvailable.available === 'readily';
    }
  
    async generateQuiz(content, options = {}) {
      try {
        if (!this.promptSession) {
          this.promptSession = await window.ai.prompt.create({
            temperature: 0.7,
            topK: 3,
          });
        }
  
        const prompt = `Create a quiz from this content: "${content}"
        
        Generate ${options.questionCount || 5} multiple choice questions with 4 options each.
        Difficulty: ${options.difficulty || 'medium'}
        Format as JSON: {
          "questions": [
            {
              "question": "...",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": 0,
              "explanation": "..."
            }
          ]
        }`;
  
        const response = await this.promptSession.prompt(prompt);
        return JSON.parse(response);
      } catch (error) {
        console.error('Quiz generation failed:', error);
        throw error;
      }
    }
  
    async summarizeContent(content) {
      try {
        if (!this.summarizerSession) {
          this.summarizerSession = await window.ai.summarizer.create();
        }
        
        return await this.summarizerSession.summarize(content);
      } catch (error) {
        console.error('Summarization failed:', error);
        throw error;
      }
    }
  
    destroy() {
      if (this.promptSession) {
        this.promptSession.destroy();
      }
      if (this.summarizerSession) {
        this.summarizerSession.destroy();
      }
    }
  }
  
  export const chromeAI = new ChromeAI();
  