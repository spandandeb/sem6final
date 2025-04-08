import axios from 'axios';

/**
 * Analyzes sentiment of text using the ML model
 * @param text Text to analyze
 * @returns Promise with sentiment analysis result (positive, negative, or neutral)
 */
export const analyzeSentiment = async (text: string): Promise<{ 
  sentiment: 'positive' | 'negative' | 'neutral',
  score: number 
}> => {
  try {
    // Default to neutral if text is empty or too short
    if (!text || text.length < 5) {
      return { sentiment: 'neutral', score: 0.5 };
    }
    
    // Call the backend API that uses the ML model
    const response = await axios.post('http://localhost:5000/api/sentiment/analyze', {
      texts: [text]
    });
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        sentiment: result.sentiment as 'positive' | 'negative' | 'neutral',
        score: result.score
      };
    }
    
    // Fallback to simple keyword-based analysis if API fails
    return fallbackSentimentAnalysis(text);
  } catch (error) {
    console.error('Error analyzing sentiment with API:', error);
    // Fallback to simple keyword-based analysis
    return fallbackSentimentAnalysis(text);
  }
};

/**
 * Fallback sentiment analysis using keyword matching
 * @param text Text to analyze
 * @returns Sentiment analysis result
 */
const fallbackSentimentAnalysis = (text: string): { 
  sentiment: 'positive' | 'negative' | 'neutral',
  score: number 
} => {
  // Convert text to lowercase for analysis
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'enjoy', 'helpful', 'best', 'fantastic', 'wonderful', 'thank', 'appreciate'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 'disappointing', 'useless', 'boring', 'waste', 'difficult', 'confusing'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Count occurrences of positive and negative words
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) {
      positiveScore++;
    }
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) {
      negativeScore++;
    }
  });
  
  // Calculate final score (0 to 1 where 0 is negative, 1 is positive)
  const totalWords = lowerText.split(/\s+/).length;
  const score = (positiveScore - negativeScore) / Math.max(1, totalWords) + 0.5;
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  // Determine sentiment based on score
  let sentiment: 'positive' | 'negative' | 'neutral';
  if (normalizedScore > 0.6) {
    sentiment = 'positive';
  } else if (normalizedScore < 0.4) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }
  
  return { sentiment, score: normalizedScore };
};

/**
 * Batch analyze multiple texts
 * @param texts Array of texts to analyze
 * @returns Promise with array of sentiment results
 */
export const batchAnalyzeSentiment = async (texts: string[]): Promise<Array<{ 
  sentiment: 'positive' | 'negative' | 'neutral',
  score: number 
}>> => {
  try {
    // Filter out empty texts
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    
    if (validTexts.length === 0) {
      return [];
    }
    
    // Call the backend API that uses the ML model
    const response = await axios.post('http://localhost:5000/api/sentiment/analyze', {
      texts: validTexts
    });
    
    if (response.data && response.data.results) {
      return response.data.results.map((result: any) => ({
        sentiment: result.sentiment as 'positive' | 'negative' | 'neutral',
        score: result.score
      }));
    }
    
    // Fallback to individual analysis if batch API fails
    return Promise.all(texts.map(text => fallbackSentimentAnalysis(text)));
  } catch (error) {
    console.error('Error batch analyzing sentiment with API:', error);
    // Fallback to individual analysis
    return Promise.all(texts.map(text => fallbackSentimentAnalysis(text)));
  }
};
