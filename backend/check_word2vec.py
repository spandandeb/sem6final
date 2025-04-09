import pickle
import os
import sys

def check_word2vec_model(model_path):
    """Check if the Word2Vec model is valid and print its properties"""
    print(f"Checking Word2Vec model at: {model_path}")
    print(f"File exists: {os.path.exists(model_path)}")
    
    if not os.path.exists(model_path):
        print("Error: File does not exist")
        return
    
    try:
        print(f"File size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
        
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        print(f"Model type: {type(model)}")
        print(f"Model attributes: {dir(model)}")
        
        # Check if it looks like a Word2Vec model
        if hasattr(model, 'wv'):
            print("This appears to be a gensim Word2Vec model")
            if hasattr(model.wv, 'key_to_index'):
                print(f"Vocabulary size: {len(model.wv.key_to_index)}")
                print(f"Sample words: {list(model.wv.key_to_index.keys())[:10]}")
            elif hasattr(model.wv, 'vocab'):
                print(f"Vocabulary size: {len(model.wv.vocab)}")
                print(f"Sample words: {list(model.wv.vocab.keys())[:10]}")
        else:
            print("This does not appear to be a standard gensim Word2Vec model")
            
            # Try to determine what kind of object it is
            if hasattr(model, 'shape'):
                print(f"Object has shape: {model.shape}")
            if hasattr(model, 'keys'):
                print(f"Object has keys: {list(model.keys())[:10]}")
            if hasattr(model, '__len__'):
                print(f"Object length: {len(model)}")
    
    except Exception as e:
        print(f"Error loading or processing model: {e}")

if __name__ == "__main__":
    # Check the model in src directory
    model_path = os.path.join('..', 'src', 'trained_word2vec.pkl')
    check_word2vec_model(model_path)
