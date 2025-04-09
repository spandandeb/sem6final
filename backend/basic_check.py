import pickle
import os
import sys

def basic_check(file_path):
    """Most basic check of a pickle file - just try to load it"""
    print(f"Checking file at: {file_path}")
    print(f"File exists: {os.path.exists(file_path)}")
    
    if not os.path.exists(file_path):
        print("Error: File does not exist")
        return
    
    print(f"File size: {os.path.getsize(file_path) / (1024*1024):.2f} MB")
    
    try:
        # Try to open the file in binary mode to check if it's readable
        with open(file_path, 'rb') as f:
            # Just read the first few bytes
            header = f.read(10)
            print(f"First few bytes (hex): {header.hex()}")
    except Exception as e:
        print(f"Error reading file: {e}")
        return

if __name__ == "__main__":
    # Check the model in src directory
    file_path = os.path.join('..', 'src', 'trained_word2vec.pkl')
    basic_check(file_path)
