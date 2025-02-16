const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');

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


//GET get the result if you got job or not 




module.exports = router;