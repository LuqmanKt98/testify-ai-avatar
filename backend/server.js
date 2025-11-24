// Load environment variables in local/dev only
const path = require('path');
try {
  if (!process.env.VERCEL) {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  }
} catch (_) {}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔧 Environment variables:');
console.log('PORT from .env:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL || 'gpt-4o');
console.log('HEYGEN_API_KEY:', process.env.HEYGEN_API_KEY ? 'Set' : 'Not set');
console.log('HEYGEN_BASE_URL:', process.env.HEYGEN_BASE_URL);
console.log('HEYGEN_AVATAR_ID:', process.env.HEYGEN_AVATAR_ID);
console.log('Using PORT:', PORT);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/llm', require('./routes/llm'));
app.use('/api/heygen', require('./routes/heygen'));
app.use('/api/knowledge-base', require('./routes/knowledgeBase'));
app.use('/api/whisper', require('./routes/whisper'));
app.use('/api/analysis', require('./routes/analysis'));

// Realtime API routes (HTTP endpoints)
const { router: realtimeRouter } = require('./routes/realtime');
app.use('/api/realtime', realtimeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

let server = null;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`🚀 Testify Backend Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🎙️ Realtime API WebSocket: ws://localhost:${PORT}/api/realtime`);
  });

  // Setup WebSocket server for Realtime API only in long-running environments
  const { setupRealtimeWebSocket } = require('./routes/realtime');
  setupRealtimeWebSocket(server);
}

// Export Express app for serverless environments (Vercel @vercel/node)
module.exports = app;
