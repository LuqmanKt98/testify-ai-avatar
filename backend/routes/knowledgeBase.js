const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'txt').split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// In-memory storage for knowledge base files (in production, use a database)
const knowledgeBaseStorage = new Map();

// Upload knowledge base file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    const file = req.file;
    const fileId = uuidv4();
    
    // Validate file content
    let content = '';
    if (file.mimetype === 'text/plain' || path.extname(file.originalname).toLowerCase() === '.txt') {
      content = file.buffer.toString('utf8');
    } else {
      return res.status(400).json({ 
        error: 'Only text files (.txt) are supported' 
      });
    }

    // Validate content length (max 50,000 characters)
    if (content.length > 50000) {
      return res.status(400).json({ 
        error: 'File too large. Please use a file with less than 50,000 characters.' 
      });
    }
    
    // Check if content contains mostly readable text
    const readableChars = content.replace(/[^\x20-\x7E\n\r\t]/g, '').length;
    const totalChars = content.length;
    const readabilityRatio = readableChars / totalChars;
    
    if (readabilityRatio < 0.8) {
      return res.status(400).json({ 
        error: 'File contains binary data. Please upload a plain text file (.txt).' 
      });
    }

    // Store the knowledge base
    knowledgeBaseStorage.set(fileId, {
      id: fileId,
      name: file.originalname,
      content: content,
      size: content.length,
      uploadedAt: new Date().toISOString(),
      type: 'uploaded'
    });

    console.log(`📚 Knowledge base uploaded: ${file.originalname} (${content.length} characters)`);

    res.json({
      success: true,
      knowledgeBaseId: fileId,
      fileName: file.originalname,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Knowledge base upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload knowledge base',
      message: error.message 
    });
  }
});

// Get knowledge base content
router.get('/:knowledgeBaseId', (req, res) => {
  try {
    const { knowledgeBaseId } = req.params;
    
    const knowledgeBase = knowledgeBaseStorage.get(knowledgeBaseId);
    
    if (!knowledgeBase) {
      return res.status(404).json({ 
        error: 'Knowledge base not found' 
      });
    }

    res.json({
      success: true,
      knowledgeBase: {
        id: knowledgeBase.id,
        name: knowledgeBase.name,
        content: knowledgeBase.content,
        size: knowledgeBase.size,
        uploadedAt: knowledgeBase.uploadedAt,
        type: knowledgeBase.type
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Knowledge base retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve knowledge base',
      message: error.message 
    });
  }
});

// Delete knowledge base
router.delete('/:knowledgeBaseId', (req, res) => {
  try {
    const { knowledgeBaseId } = req.params;
    
    const knowledgeBase = knowledgeBaseStorage.get(knowledgeBaseId);
    
    if (!knowledgeBase) {
      return res.status(404).json({ 
        error: 'Knowledge base not found' 
      });
    }

    knowledgeBaseStorage.delete(knowledgeBaseId);
    
    console.log(`📚 Knowledge base deleted: ${knowledgeBase.name}`);

    res.json({
      success: true,
      message: 'Knowledge base deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Knowledge base deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete knowledge base',
      message: error.message 
    });
  }
});

// List all knowledge bases
router.get('/', (req, res) => {
  try {
    const knowledgeBases = Array.from(knowledgeBaseStorage.values()).map(kb => ({
      id: kb.id,
      name: kb.name,
      size: kb.size,
      uploadedAt: kb.uploadedAt,
      type: kb.type
    }));

    res.json({
      success: true,
      knowledgeBases: knowledgeBases,
      count: knowledgeBases.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Knowledge base list error:', error);
    res.status(500).json({ 
      error: 'Failed to list knowledge bases',
      message: error.message 
    });
  }
});

// Get default knowledge base (Legal Interview Protocol)
router.get('/default/content', (req, res) => {
  try {
    const defaultKnowledgeBase = `PERSONA:
You are a professional legal interviewer (barrister) conducting structured witness examinations. 
You are serious, respectful, and inquisitive — your goal is to uncover facts clearly and precisely.

ROLE:
Claimant's Barrister (Interviewer)

OPENING MESSAGE:
"Good day. I'm the claimant's counsel, and I'll be asking you a few questions to better understand your position and the facts of this case. Please answer truthfully and clearly."

KNOWLEDGE BASE:
Your task is to question the witness using the guidance and sequence below.
Ask one question at a time, and wait for the witness's answer before moving on to the next question.
Maintain a professional tone and refer to this knowledge as your context when forming questions or responses.

Q1: Please introduce yourself — your full name, role, and connection to this case.  
Q2: Can you briefly describe the main issue or dispute from your perspective?  
Q3: Were there any specific procedures, policies, or events that contributed to the situation?  
Q4: How did your team respond to the challenges or claims raised?  
Q5: Are there any documents or evidence that support your testimony?  
Q6: Did you personally witness the events in question, or were you informed later?  
Q7: Looking back, is there anything you would have done differently to prevent this issue?  
Q8: Finally, is there anything else you wish the tribunal to know before we conclude?

INSTRUCTIONS:
1. Always start with the opening message before the first question.  
2. Ask each question in order and move forward only after the witness has finished their answer.  
3. Never answer the questions yourself.  
4. Maintain a calm, professional, and slightly authoritative tone.  
5. After all questions are complete, summarize the witness's responses briefly and thank them.  
6. Example closing line: "Thank you for your cooperation. That concludes my questions for now."`;

    res.json({
      success: true,
      content: defaultKnowledgeBase,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Default knowledge base error:', error);
    res.status(500).json({ 
      error: 'Failed to get default knowledge base',
      message: error.message 
    });
  }
});

module.exports = router;
