const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const analyzeRoutes = require('./routes/analyze');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api', uploadRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 CodeDNA Backend running on http://localhost:${PORT}`);
});
