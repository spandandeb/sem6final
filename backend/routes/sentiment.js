const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

/**
 * @route POST /api/sentiment/analyze
 * @desc Analyze sentiment of text using the ML model
 * @access Public
 */
router.post('/analyze', async (req, res) => {
  try {
    const { texts } = req.body;
    
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Please provide an array of texts to analyze' });
    }

    // Filter out empty texts
    const validTexts = texts.filter(text => text && text.trim().length > 0);
    
    if (validTexts.length === 0) {
      return res.json({ results: [] });
    }

    // Spawn Python process
    const pythonProcess = spawn('python', [
      path.join(__dirname, '..', 'sentiment_analyzer.py')
    ]);

    let dataString = '';
    let errorString = '';

    // Send data to Python script
    pythonProcess.stdin.write(JSON.stringify({ texts: validTexts }));
    pythonProcess.stdin.end();

    // Collect data from Python script
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        console.error(`Error: ${errorString}`);
        return res.status(500).json({ error: 'Error processing sentiment analysis' });
      }

      try {
        const results = JSON.parse(dataString);
        return res.json(results);
      } catch (err) {
        console.error('Error parsing Python output:', err);
        return res.status(500).json({ error: 'Error parsing sentiment analysis results' });
      }
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
