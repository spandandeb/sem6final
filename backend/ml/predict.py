import sys
import json
import pickle
import numpy as np
from sklearn.preprocessing import StandardScaler
import os
import gensim

def main():
    # Read input data from stdin
    input_data = sys.stdin.read()
    data = json.loads(input_data)
    
    student = data['student']
    mentors = data['mentors']
    
    try:
        # Load the ML model from .pkl file
        import os
        # Look for the model in the src directory instead
        model_path = os.path.join(os.path.dirname(__file__), '../../src/ml_model.pkl')
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # Load the Word2Vec model
        word2vec_path = os.path.join(os.path.dirname(__file__), '../../src/trained_word2vec.pkl')
        try:
            with open(word2vec_path, 'rb') as f:
                word2vec_model = pickle.load(f)
            print("Word2Vec model loaded successfully", file=sys.stderr)
        except Exception as e:
            print(f"Error loading Word2Vec model: {e}", file=sys.stderr)
            word2vec_model = None
        
        # Process each mentor and calculate match score
        scored_mentors = []
        for mentor in mentors:
            # Extract features for the student-mentor pair
            features = extract_features(student, mentor, word2vec_model)
            
            # Normalize features
            scaler = StandardScaler()
            features_scaled = scaler.fit_transform([features])[0]
            
            # Predict match score using the model
            match_score = model.predict([features_scaled])[0]
            
            # Scale score to 0-100 range
            match_score = min(100, max(0, int(match_score * 100)))
            
            # Add match score to mentor data
            scored_mentor = mentor.copy()
            scored_mentor['matchScore'] = match_score
            scored_mentors.append(scored_mentor)
        
        # Sort mentors by match score
        scored_mentors.sort(key=lambda x: x['matchScore'], reverse=True)
        
        # Return results
        result = {'mentors': scored_mentors}
        print(json.dumps(result))
        
    except Exception as e:
        # If model loading or prediction fails, use fallback calculation
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

def calculate_text_similarity(text1, text2, word2vec_model):
    """Calculate semantic similarity between two texts using Word2Vec"""
    if word2vec_model is None:
        return 0
    
    try:
        # Convert texts to lowercase and split into words
        words1 = text1.lower().split()
        words2 = text2.lower().split()
        
        # Filter words that exist in the model's vocabulary
        words1 = [word for word in words1 if word in word2vec_model.wv.key_to_index]
        words2 = [word for word in words2 if word in word2vec_model.wv.key_to_index]
        
        if not words1 or not words2:
            return 0
        
        # Calculate average vector for each text
        vec1 = sum(word2vec_model.wv[word] for word in words1) / len(words1)
        vec2 = sum(word2vec_model.wv[word] for word in words2) / len(words2)
        
        # Calculate cosine similarity
        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        return max(0, similarity)  # Ensure non-negative
    except Exception as e:
        print(f"Error calculating text similarity: {e}", file=sys.stderr)
        return 0

def extract_features(student, mentor, word2vec_model=None):
    """Extract features from student and mentor data for ML model"""
    features = []
    
    # Skills match (count of common skills + semantic similarity)
    student_skills = [s['name'].lower() for s in student['skills']]
    mentor_skills = [s['name'].lower() for s in mentor['skills']]
    
    # Direct match (exact skills)
    student_skills_set = set(student_skills)
    mentor_skills_set = set(mentor_skills)
    common_skills = student_skills_set.intersection(mentor_skills_set)
    direct_match = len(common_skills)
    
    # Semantic match (using Word2Vec)
    semantic_match = 0
    if word2vec_model is not None:
        # For each student skill, find the best matching mentor skill
        for s_skill in student_skills:
            if s_skill in mentor_skills_set:  # Skip if already directly matched
                continue
            
            # Calculate similarity with each mentor skill
            max_similarity = 0
            for m_skill in mentor_skills:
                similarity = calculate_text_similarity(s_skill, m_skill, word2vec_model)
                max_similarity = max(max_similarity, similarity)
            
            semantic_match += max_similarity
    
    # Combine direct and semantic matches
    skills_match = direct_match + semantic_match
    features.append(skills_match)
    
    # Industry match (binary)
    industry_match = 1 if student['industry']['id'] == mentor['industry']['id'] else 0
    features.append(industry_match)
    
    # Interests match (count of common interests + semantic similarity)
    student_interests = [i.lower() for i in student['interests']]
    mentor_interests = [i.lower() for i in mentor['interests']]
    
    # Direct match (exact interests)
    student_interests_set = set(student_interests)
    mentor_interests_set = set(mentor_interests)
    common_interests = student_interests_set.intersection(mentor_interests_set)
    direct_match = len(common_interests)
    
    # Semantic match (using Word2Vec)
    semantic_match = 0
    if word2vec_model is not None:
        # For each student interest, find the best matching mentor interest
        for s_interest in student_interests:
            if s_interest in mentor_interests_set:  # Skip if already directly matched
                continue
            
            # Calculate similarity with each mentor interest
            max_similarity = 0
            for m_interest in mentor_interests:
                similarity = calculate_text_similarity(s_interest, m_interest, word2vec_model)
                max_similarity = max(max_similarity, similarity)
            
            semantic_match += max_similarity
    
    # Combine direct and semantic matches
    interests_match = direct_match + semantic_match
    features.append(interests_match)
    
    # Location match (binary)
    location_match = 1 if student['location'] == mentor['location'] else 0
    features.append(location_match)
    
    # Experience years difference
    experience_diff = abs(student['experienceYears'] - mentor['experienceYears'])
    features.append(experience_diff)
    
    # Mentor rating
    features.append(mentor['rating'])
    
    # Mentor total mentees
    features.append(mentor['totalMentees'])
    
    # Bio similarity (semantic similarity between student and mentor bios)
    if word2vec_model is not None and 'bio' in student and 'bio' in mentor:
        bio_similarity = calculate_text_similarity(student['bio'], mentor['bio'], word2vec_model)
        features.append(bio_similarity)
    else:
        features.append(0)
    
    return features

if __name__ == "__main__":
    main()
