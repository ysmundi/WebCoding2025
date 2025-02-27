const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');
const isAuthenticated = require('../middlewares/auth');

const router = express.Router();

//Check user subscription 
router.get('/subscription/:userId', isAuthenticated, (req, res) => {
  const userId = req.params.userId;

  const sql = 'SELECT subscription FROM users_info WHERE id = ?';

  db.query(sql, [userId], (error, result) => {
    if (error) {
      res.status(500).json({ message: "Server error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return success response
    res.status(201).json(result[0] );
  })
});

//Activate standard subscription 
router.put('/subscription-standard/:userId', isAuthenticated, (req, res) => {
  const userId = req.params.userId;

  const sql = 'UPDATE users_info SET subscription = "Standard", max_postings = 3 WHERE id = ?';

  db.query(sql, [userId], (error, result) => {
    if (error) {
      res.status(500).json({ message: "Server error" });
    }
     
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return success response
    res.status(201).json({ message: 'Standard subscription is activated!' });
  })
});

//Acivate value subscription 
router.post('/subscription-value/:userId', isAuthenticated, (req, res) => {
  const userId = req.params.userId;

  const sql = 'UPDATE users_info SET subscription = "Value", max_postings = 10 WHERE id = ?';

  db.query(sql, [userId], (error, result) => {
    if (error) {
      res.status(500).json({ message: "Server error" });
    }
     
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return success response
    res.status(201).json({ message: 'Value subscription is activated!' });
  })
});

//Activate professional subscription 
router.post('/subscription-professional/:userId', isAuthenticated, (req, res) => {
  const userId = req.params.userId;

  const sql = 'UPDATE users_info SET subscription = "Professional", max_postings = 11 WHERE id = ?';

  db.query(sql, [userId], (error, result) => {
    if (error) {
      res.status(500).json({ message: "Server error" });
    }
     
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return success response
    res.status(201).json({ message: 'Professional subscription is activated!' });
  })
});



// POST /recruiter/post-job - Create a new job posting
router.post('/post-job', isAuthenticated, (req, res) => {
  const jobData = req.body;

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

//GET get pending applications 
router.get('/pending-job-applications/:jobId', isAuthenticated, (req, res) => {
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

//GET accepted applications 
router.get('/accepted-job-applications/:jobId', isAuthenticated, (req, res) => {
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


//Get information about job by its id
router.get('/posting-info/:jobId', isAuthenticated, (req, res) => { 
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

//PUT accept application
router.put('/accept-application/:id', isAuthenticated, (req, res) => {
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

//PUT reject application 
router.put('/reject-application/:id', isAuthenticated, (req, res) => {
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

//PUT suspend application 
router.put('/suspend-application/:id', isAuthenticated, (req, res) => {
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

//DELETE job posting 
router.delete('/delete-posting/:jobId', isAuthenticated, (req, res) => {
  const jobId = req.params.jobId; // Get the job ID from the URL parameter

  // Validate the job ID
  if (!jobId || isNaN(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  // Start a transaction to ensure atomicity
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction error:', err);
      return res.status(500).json({ error: 'Failed to start transaction' });
    }

    // Step 1: Delete all applications associated with the job ID
    const deleteApplicationsQuery = `
      DELETE FROM job_applications
      WHERE job_id = ?
    `;

    db.query(deleteApplicationsQuery, [jobId], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error('Database error (delete applications):', err);
          res.status(500).json({ error: 'Failed to delete applications' });
        });
      }

      // Step 2: Delete the job posting
      const deletePostingQuery = `
        DELETE FROM job_postings
        WHERE job_id = ?
      `;

      db.query(deletePostingQuery, [jobId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error('Database error (delete posting):', err);
            res.status(500).json({ error: 'Failed to delete posting' });
          });
        }

        // Check if the posting was found and deleted
        if (result.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: 'Posting not found' });
          });
        }

        // Commit the transaction if everything is successful
        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Commit error:', err);
              res.status(500).json({ error: 'Failed to commit transaction' });
            });
          }

          // Return success response
          res.json({ message: 'Posting and associated applications deleted successfully' });
        });
      });
    });
  });
});

module.exports = router;