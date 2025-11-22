const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for sessions (in production, use a database)
const sessions = new Map();

// Create a new session
router.post('/', (req, res) => {
  try {
    const { avatarId, quality, knowledgeBaseId } = req.body;
    
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      avatarId: avatarId || process.env.HEYGEN_AVATAR_ID,
      quality: quality || 'high',
      knowledgeBaseId: knowledgeBaseId,
      createdAt: new Date().toISOString(),
      status: 'active',
      messages: [],
      duration: 0
    };
    
    sessions.set(sessionId, session);
    
    console.log(`📝 Session created: ${sessionId}`);
    
    res.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create session',
      message: error.message 
    });
  }
});

// Get session by ID
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    res.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve session',
      message: error.message 
    });
  }
});

// Add message to session
router.post('/:sessionId/messages', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, isUser, timestamp } = req.body;
    
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    const messageEntry = {
      id: uuidv4(),
      message: message,
      isUser: isUser || false,
      timestamp: timestamp || new Date().toISOString()
    };
    
    session.messages.push(messageEntry);
    
    console.log(`📝 Message added to session ${sessionId}: ${message}`);
    
    res.json({
      success: true,
      message: messageEntry,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Message addition error:', error);
    res.status(500).json({ 
      error: 'Failed to add message to session',
      message: error.message 
    });
  }
});

// End session
router.put('/:sessionId/end', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration, report } = req.body;
    
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    session.duration = duration || 0;
    session.report = report;
    
    console.log(`📝 Session ended: ${sessionId}`);
    
    res.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ 
      error: 'Failed to end session',
      message: error.message 
    });
  }
});

// Delete session
router.delete('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    sessions.delete(sessionId);
    
    console.log(`📝 Session deleted: ${sessionId}`);

    res.json({
      success: true,
      message: 'Session deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete session',
      message: error.message 
    });
  }
});

// List all sessions
router.get('/', (req, res) => {
  try {
    const sessionList = Array.from(sessions.values()).map(session => ({
      id: session.id,
      avatarId: session.avatarId,
      quality: session.quality,
      knowledgeBaseId: session.knowledgeBaseId,
      createdAt: session.createdAt,
      status: session.status,
      endedAt: session.endedAt,
      duration: session.duration,
      messageCount: session.messages.length
    }));

    res.json({
      success: true,
      sessions: sessionList,
      count: sessionList.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session list error:', error);
    res.status(500).json({ 
      error: 'Failed to list sessions',
      message: error.message 
    });
  }
});

module.exports = router;
