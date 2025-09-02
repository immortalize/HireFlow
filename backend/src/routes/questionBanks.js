const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  COGNITIVE_QUESTIONS,
  ENGLISH_QUESTIONS,
  SITUATIONAL_JUDGMENT_QUESTIONS,
  FIT_CHECK_QUESTIONS,
  getQuestionStats,
  selectQuestionsByDifficulty
} = require('../data/questionBanks');

const router = express.Router();

// Get question bank statistics
router.get('/stats', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), async (req, res) => {
  try {
    const stats = getQuestionStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ error: 'Failed to fetch question statistics' });
  }
});

// Get questions by type and difficulty
router.get('/questions/:type', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), async (req, res) => {
  try {
    const { type } = req.params;
    const { difficulty, count } = req.query;
    
    let questions = [];
    
    switch (type.toUpperCase()) {
      case 'COGNITIVE':
        if (difficulty) {
          questions = selectQuestionsByDifficulty('COGNITIVE', parseInt(difficulty), parseInt(count) || 10);
        } else {
          // Return all cognitive questions organized by category
          questions = {
            logic: COGNITIVE_QUESTIONS.logic,
            math: COGNITIVE_QUESTIONS.math,
            verbal: COGNITIVE_QUESTIONS.verbal
          };
        }
        break;
      case 'ENGLISH':
        if (difficulty) {
          questions = selectQuestionsByDifficulty('ENGLISH', parseInt(difficulty), parseInt(count) || 10);
        } else {
          questions = ENGLISH_QUESTIONS;
        }
        break;
      case 'SITUATIONAL_JUDGMENT':
        if (difficulty) {
          questions = selectQuestionsByDifficulty('SITUATIONAL_JUDGMENT', parseInt(difficulty), parseInt(count) || 10);
        } else {
          questions = SITUATIONAL_JUDGMENT_QUESTIONS;
        }
        break;
      case 'FIT_CHECK':
        if (difficulty) {
          questions = selectQuestionsByDifficulty('FIT_CHECK', parseInt(difficulty), parseInt(count) || 10);
        } else {
          questions = FIT_CHECK_QUESTIONS;
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid question type' });
    }
    
    res.json({ 
      type: type.toUpperCase(),
      questions,
      total: Array.isArray(questions) ? questions.length : 
             Object.values(questions).reduce((sum, arr) => sum + arr.length, 0)
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get question categories
router.get('/categories', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), async (req, res) => {
  try {
    const categories = {
      COGNITIVE: {
        logic: 'Logic and Reasoning',
        math: 'Mathematical Ability',
        verbal: 'Verbal Comprehension'
      },
      ENGLISH: {
        grammar: 'Grammar',
        vocabulary: 'Vocabulary'
      },
      SITUATIONAL_JUDGMENT: {
        teamwork: 'Teamwork',
        professionalism: 'Professionalism',
        communication: 'Communication',
        customer_service: 'Customer Service',
        safety: 'Safety',
        project_management: 'Project Management',
        change_management: 'Change Management',
        learning: 'Learning'
      },
      FIT_CHECK: {
        work_style: 'Work Style',
        motivation: 'Motivation',
        stress_management: 'Stress Management',
        environment: 'Work Environment',
        feedback: 'Feedback Preference',
        leadership: 'Leadership Style',
        learning_style: 'Learning Style',
        values: 'Work Values',
        conflict_resolution: 'Conflict Resolution',
        project_preference: 'Project Preference'
      }
    };
    
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get difficulty levels
router.get('/difficulties', authenticateToken, requireRole(['EMPLOYER', 'HR_MANAGER', 'HIRING_MANAGER']), async (req, res) => {
  try {
    const difficulties = {
      1: 'Easy',
      2: 'Medium',
      3: 'Hard',
      4: 'Expert'
    };
    
    res.json({ difficulties });
  } catch (error) {
    console.error('Error fetching difficulties:', error);
    res.status(500).json({ error: 'Failed to fetch difficulties' });
  }
});

module.exports = router;
