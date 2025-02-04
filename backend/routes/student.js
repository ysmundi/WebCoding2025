const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');

router = express.Router();

//POST apply for a job 

router.post('/apply', upload.single('profile_file'), (req, res) => {
    const { job_id, user_id, name, email, phone_number, about_you } = req.body;
  
    // Validate input
    if (!job_id || !user_id || !name || !email || !req.file) {
      return res.status(400).json({ error: 'Job ID, User ID, Name, Email, and Profile File are required.' });
    }
  
    const profile_file = req.file.filename; // Get the filename from the uploaded file
  
    const query = `
      INSERT INTO job_applications (job_id, user_id, name, email, phone_number, profile_file, about_you)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
    req.db.query(query, [job_id, user_id, name, email, phone_number, profile_file, about_you], (error, result) => {
      if (error) {
        console.error('Error applying for job: ', error);
        return res.status(500).json({ error: 'Failed to apply for job' });
      }
  
      res.status(201).json({ message: 'Application submitted successfully', application_id: result.insertId });
    });
  });


//GET get the result if you got job or not 




module.exports = router;