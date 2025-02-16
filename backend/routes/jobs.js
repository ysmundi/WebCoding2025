const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');

const router = express.Router();


  // GET /api/jobs/user/:userId - Get job postings for a specific user
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    try {
        db.query('SELECT * FROM job_postings WHERE user_id = ?', [userId], (err, results) => {
            res.json(results);
          });
    }
    catch(err) {
        res.status(500).json({error: "Server error"})
    }
  });
  
  // PUT /api/jobs/:jobId - Update job status (admin)
router.put('/update-job/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const newStatus = req.body.status; // 'approved', 'denied'
    // ... (Add authorization to ensure only admins can update) ...
  
    db.query('UPDATE job_postings SET status = ? WHERE job_id = ?', [newStatus, jobId], (err, result) => {
      // ... error handling ...
      res.json({ message: 'Job posting status updated' });
    });
  });

  router.get('/all-jobs', (req, res) => {
    const query = 'SELECT * FROM job_postings';
  
    db.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching job postings:', error);
        res.status(500).json({ error: 'Failed to fetch job postings' }); 
      } else {
        res.status(200).json(results);
      }
    });
  });

  router.get('/pending-jobs', (req, res) => {
    const query = "SELECT * FROM job_postings WHERE status = 'pending'"; 

    db.query(query, (error, result) => {
        if (error) {
            console.error('Error fetching job postings: ', error);
            res.status(500).json({ error: 'Failed to fetch job postins' });
        } else {
            res.status(200).json(result);
        }
    })
  })
  

  //GET get the application by id
router.get('/application-info/:applicationId', (req, res) => {
  const applicationId = req.params.applicationId;

  try {
      db.query('SELECT * FROM job_applications WHERE application_id = ?', [applicationId], (err, results) => {
          res.json(results);
        });
  }
  catch(err) {
      res.status(500).json({error: "Server error"})
  }
})
  
  // ... other routes for getting job details, etc. ...
  
  // Error handling middleware (add after other routes)
  module.exports = router;
