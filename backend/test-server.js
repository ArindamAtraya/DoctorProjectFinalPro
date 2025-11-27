const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', timestamp: new Date() });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log(`📁 Serving from: ${path.join(__dirname, '../frontend')}`);
});