import pickle
import sys
import json
import os

def load_model(model_path):
    """Load the sentiment analysis model from the pickle file"""
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}", file=sys.stderr)
        return None

def analyze_sentiment(text, model):
    """Analyze sentiment of text using the loaded model"""
    try:
        # Preprocess text if needed
        # For most sklearn models, we'd need to vectorize the text first
        # This depends on how your model was trained
        
        # Make prediction
        prediction = model.predict([text])[0]
        
        # Get probability scores if available
        try:
            proba = model.predict_proba([text])[0]
            confidence = max(proba)
        except:
            confidence = 1.0
            
        # Map prediction to sentiment
        # Adjust this mapping based on your model's output labels
        if prediction == 1:
            sentiment = "positive"
        elif prediction == 0:
            sentiment = "neutral"
        else:
            sentiment = "negative"
            
        return {
            "sentiment": sentiment,
            "score": float(confidence),
            "text": text
        }
    except Exception as e:
        print(f"Error analyzing sentiment: {str(e)}", file=sys.stderr)
        return {"sentiment": "neutral", "score": 0.5, "text": text}

def batch_analyze(texts, model_path="../src/sentiment_model.pkl"):
    """Analyze sentiment for multiple texts"""
    model = load_model(model_path)
    if not model:
        return [{"sentiment": "neutral", "score": 0.5, "text": text} for text in texts]
    
    results = []
    for text in texts:
        if not text or len(text.strip()) < 5:
            results.append({"sentiment": "neutral", "score": 0.5, "text": text})
        else:
            results.append(analyze_sentiment(text, model))
    
    return results

if __name__ == "__main__":
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    texts = input_data.get("texts", [])
    
    # Use the specified model path or default
    model_path = input_data.get("model_path", "../src/sentiment_model.pkl")
    
    # Analyze sentiments
    results = batch_analyze(texts, model_path)
    
    # Output results as JSON
    print(json.dumps({"results": results}))
