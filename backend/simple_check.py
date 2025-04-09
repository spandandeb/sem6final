import pickle
import os
import sys

def check_pickle_file(file_path):
    """Basic check of a pickle file to see what's inside"""
    print(f"Checking file at: {file_path}")
    print(f"File exists: {os.path.exists(file_path)}")
    
    if not os.path.exists(file_path):
        print("Error: File does not exist")
        return
    
    try:
        print(f"File size: {os.path.getsize(file_path) / (1024*1024):.2f} MB")
        
        with open(file_path, 'rb') as f:
            data = pickle.load(f)
        
        print(f"Data type: {type(data)}")
        
        # Try to determine what kind of object it is
        if hasattr(data, '__dict__'):
            print(f"Object attributes: {list(data.__dict__.keys())}")
        
        if hasattr(data, 'shape'):
            print(f"Object has shape: {data.shape}")
        
        if hasattr(data, 'keys'):
            if callable(data.keys):
                print(f"Object has keys: {list(data.keys())[:10] if len(list(data.keys())) > 10 else list(data.keys())}")
        
        if hasattr(data, '__len__'):
            print(f"Object length: {len(data)}")
            
            # If it's a list or tuple, show sample items
            if isinstance(data, (list, tuple)):
                print(f"First few items: {data[:3]}")
                
                # Check if items have a specific structure
                if len(data) > 0:
                    print(f"First item type: {type(data[0])}")
                    
                    if hasattr(data[0], '__dict__'):
                        print(f"First item attributes: {list(data[0].__dict__.keys())}")
    
    except Exception as e:
        print(f"Error loading or processing file: {e}")

if __name__ == "__main__":
    # Check the model in src directory
    file_path = os.path.join('..', 'src', 'trained_word2vec.pkl')
    check_pickle_file(file_path)
