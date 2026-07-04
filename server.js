const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Leaderboard database file
const leaderboardFile = path.join(__dirname, 'leaderboard.json');

// Initialize leaderboard file if it doesn't exist
function initializeLeaderboard() {
  if (!fs.existsSync(leaderboardFile)) {
    fs.writeFileSync(leaderboardFile, JSON.stringify({ scores: [] }, null, 2));
  }
}

// Read leaderboard data
function readLeaderboard() {
  try {
    const data = fs.readFileSync(leaderboardFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { scores: [] };
  }
}

// Write leaderboard data
function writeLeaderboard(data) {
  fs.writeFileSync(leaderboardFile, JSON.stringify(data, null, 2));
}

// Get global leaderboard
app.get('/api/leaderboard', (req, res) => {
  const data = readLeaderboard();
  // Sort by attempts (ascending - fewer attempts is better) and then by date (newest first)
  const sorted = data.scores
    .sort((a, b) => {
      if (a.attempts !== b.attempts) {
        return a.attempts - b.attempts;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    })
    .slice(0, 100); // Top 100
  
  res.json({ scores: sorted });
});

// Get leaderboard for specific difficulty
app.get('/api/leaderboard/:difficulty', (req, res) => {
  const { difficulty } = req.params;
  const data = readLeaderboard();
  
  const filtered = data.scores
    .filter(score => score.difficulty === difficulty)
    .sort((a, b) => {
      if (a.attempts !== b.attempts) {
        return a.attempts - b.attempts;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    })
    .slice(0, 100);
  
  res.json({ scores: filtered });
});

// Submit score
app.post('/api/leaderboard', (req, res) => {
  const { playerName, difficulty, attempts, number } = req.body;
  
  if (!playerName || !difficulty || typeof attempts !== 'number' || typeof number !== 'number') {
    return res.status(400).json({ error: 'Invalid score data' });
  }
  
  const data = readLeaderboard();
  
  const newScore = {
    id: Date.now(),
    playerName: playerName.substring(0, 20), // Limit name length
    difficulty,
    attempts,
    number,
    timestamp: new Date().toISOString()
  };
  
  data.scores.push(newScore);
  writeLeaderboard(data);
  
  res.json({ success: true, score: newScore });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize and start server
initializeLeaderboard();
app.listen(PORT, () => {
  console.log(`Angka Bom server running on http://localhost:${PORT}`);
});
