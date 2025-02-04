const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');

const router = express.Router();

// POST /recruiter/post-job - Create a new job posting
router.post('/post-job', (req, res) => {
    const jobData = req.body;
    // Add user_id from authenticated user session/token
    // ...
  
    db.query('INSERT INTO job_postings SET ?', jobData, (err, result) => {
      if (err) {
        console.error('Error creating job posting:', err);
        res.status(500).json({ error: 'Failed to create job posting' });
        return;
      }
      res.status(201).json({ 
        message: 'Job posting created successfully', 
        jobId: result.insertId 
      });
    });
  });
  
//GET get applications 

router.get('job-applications/:jobId', (req, res) => {
    const jobId = req.params.jobId;

    try {
        db.query('SELECT * FROM job_applications WHERE job_id = ?', [jobId], (err, results) => {
            res.json(results);
          });
    }
    catch(err) {
        res.status(500).json({error: "Server error"})
    }
})

module.exports = router;