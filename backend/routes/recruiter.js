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

router.get('/pending-job-applications/:jobId', (req, res) => {
    const status = 'pending'
    const jobId = req.params.jobId;

    try {
        db.query('SELECT * FROM job_applications WHERE job_id = ? AND status = ?', [jobId, status], (err, results) => {
            res.json(results);
          });
    }
    catch(err) {
        res.status(500).json({error: "Server error"})
    }
})

router.get('/accepted-job-applications/:jobId', (req, res) => {
  const status = 'accepted'
  const jobId = req.params.jobId;

  try {
      db.query('SELECT * FROM job_applications WHERE job_id = ? AND status = ?', [jobId, status], (err, results) => {
          res.json(results);
        });
  }
  catch(err) {
      res.status(500).json({error: "Server error"})
  }
})


//get information about job 
router.get('/posting-info/:jobId', (req, res) => {
  const jobId = req.params.jobId;

  try {
      db.query('SELECT * FROM job_postings WHERE job_id = ?', [jobId], (err, results) => {
          res.json(results);
        });
  }
  catch(err) {
      res.status(500).json({error: "Server error"})
  }
})

//update status of application 
router.put('/accept-application/:id', (req, res) => {
  const applicationId = req.params.id; // Get the application ID from the URL parameter

  // Validate the application ID
  if (!applicationId || isNaN(applicationId)) {
    return res.status(400).json({ error: 'Invalid application ID' });
  }

  // SQL query to update the status and approved_date
  const sql = `
    UPDATE job_applications
    SET status = 'accepted', approved_date = NOW()
    WHERE application_id = ?
  `;

  // Execute the query
  db.query(sql, [applicationId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update application status' });
    }

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Return success response
    res.json({ message: 'Application accepted successfully' });
  });
});

//delete application 
router.put('/reject-application/:id', (req, res) => {
  const applicationId = req.params.id; // Get the application ID from the URL parameter

  // Validate the application ID
  if (!applicationId || isNaN(applicationId)) {
    return res.status(400).json({ error: 'Invalid application ID' });
  }

  // SQL query to update the status and approved_date
  const sql = `
    UPDATE job_applications
    SET status = 'rejected'
    WHERE application_id = ?
  `;

  // Execute the query
  db.query(sql, [applicationId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update application status' });
    }

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Return success response
    res.json({ message: 'Application reject successfully' });
  });
})

//delete application 
router.delete('/suspend-application/:id', (req, res) => {
  const applicationId = req.params.id; // Get the application ID from the URL parameter

  // Validate the application ID
  if (!applicationId || isNaN(applicationId)) {
    return res.status(400).json({ error: 'Invalid application ID' });
  }

  // SQL query to update the status and approved_date
  const sql = `
    UPDATE job_applications
    SET status = 'suspended'
    WHERE application_id = ?
  `;

  // Execute the query
  db.query(sql, [applicationId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to update application status' });
    }

    // Check if any rows were affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Return success response
    res.json({ message: 'Application suspend successfully' });
  });
})

module.exports = router;