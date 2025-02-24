const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');
const isAuthenticated = require('../middlewares/auth');

router = express.Router();

//POST apply for a job 

router.post('/apply', (req, res) => {
    const { job_id, user_id, username, email, phone_number, about_you } = req.body;
  
    // Validate input
    if (!job_id || !user_id || !username || !email) {
      return res.status(400).json({ error: 'Job ID, User ID, username, Email are required.' });
    }
  
    const query = `
      INSERT INTO job_applications (job_id, user_id, username, email, phone_number, about_you)
      VALUES (?, ?, ?, ?, ?, ?)`;
  
    db.query(query, [job_id, user_id, username, email, phone_number, about_you], (error, result) => {
      if (error) {
        console.error('Error applying for job: ', error);
        return res.status(500).json({ error: 'Failed to apply for job' });
      }
  
      res.status(201).json({ message: 'Application submitted successfully', application_id: result.insertId });
    });
  });           
 
//get applications by id 
router.get('/applications/:userId', isAuthenticated, (req, res) => {
  const userId = req.params.userId;

  try {
      db.query('SELECT * FROM job_applications WHERE user_id = ?', [userId], (err, results) => {
          res.json(results);
        });
  }
  catch(err) {
      res.status(500).json({error: "Server error"})
  }
});

router.get('/student-info/:userId', isAuthenticated, (req, res) => {
  const userId = req.params.userId;

  try {
      db.query('SELECT * FROM users_info WHERE id = ?', [userId], (err, results) => {
          res.json(results);
        });
  }
  catch(err) {
      res.status(500).json({error: "Server error"})
  }
});



module.exports = router;