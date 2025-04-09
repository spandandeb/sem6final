const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// API endpoint to predict mentor matches
router.post('/predict', async (req, res) => {
  try {
    const { student, mentors } = req.body;
    
    if (!student || !mentors || !Array.isArray(mentors)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    // Check if the Word2Vec model exists
    const word2vecPath = path.join(__dirname, '../../src/trained_word2vec.pkl');
    const modelExists = fs.existsSync(word2vecPath);
    console.log(`Word2Vec model ${modelExists ? 'found' : 'not found'} at ${word2vecPath}`);
    
    // Prepare data for the Python script
    const inputData = JSON.stringify({
      student: student,
      mentors: mentors
    });
    
    // Spawn Python process to use the ML model
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../ml/predict.py')
    ]);
    
    let result = '';
    let errorData = '';
    
    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    // Collect error data
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.log('Python stderr:', data.toString());
    });
    
    // Send input data to Python script
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
    
    // Process completed
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error: ${errorData}`);
        
        // Fallback to local calculation if Python script fails
        const scoredMentors = mentors.map(mentor => ({
          ...mentor,
          matchScore: calculateLocalMatchScore(student, mentor)
        }));
        
        // Sort by match score
        scoredMentors.sort((a, b) => b.matchScore - a.matchScore);
        
        return res.json({ mentors: scoredMentors });
      }
      
      try {
        const parsedResult = JSON.parse(result);
        res.json(parsedResult);
      } catch (error) {
        console.error('Error parsing Python script output:', error);
        res.status(500).json({ error: 'Error processing match predictions' });
      }
    });
  } catch (error) {
    console.error('Error in predict endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fallback local calculation if ML model fails
function calculateLocalMatchScore(student, mentor) {
  // Create a feature vector similar to what our ML model would use
  let score = 0;
  
  // Skills match (count of common skills)
  const studentSkills = new Set(student.skills.map(skill => skill.name.toLowerCase()));
  const mentorSkills = new Set(mentor.skills.map(skill => skill.name.toLowerCase()));
  const commonSkills = [...studentSkills].filter(skill => mentorSkills.has(skill));
  score += commonSkills.length * 15;
  
  // Industry match
  if (student.industry.id === mentor.industry.id) {
    score += 20;
  }
  
  // Interests match
  const studentInterests = new Set(student.interests.map(interest => interest.toLowerCase()));
  const mentorInterests = new Set(mentor.interests.map(interest => interest.toLowerCase()));
  const commonInterests = [...studentInterests].filter(interest => mentorInterests.has(interest));
  score += commonInterests.length * 10;
  
  // Location match
  if (student.location === mentor.location) {
    score += 10;
  }
  
  // Experience years difference (inverse relationship)
  const experienceDiff = Math.abs(student.experienceYears - mentor.experienceYears);
  score += Math.max(0, 10 - experienceDiff) * 2;
  
  // Mentor rating and experience
  score += mentor.rating * 5;
  score += Math.min(mentor.totalMentees, 10) * 2;
  
  // Add a small random factor to create variability based on student profile
  // This will ensure different students get slightly different match scores
  // The random factor is seeded with a combination of student and mentor IDs
  const randomSeed = (student.id * 1000 + mentor.id) % 100;
  const randomFactor = (randomSeed / 100) * 10; // Random factor between 0-10%
  score += randomFactor;
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
}

module.exports = router;
