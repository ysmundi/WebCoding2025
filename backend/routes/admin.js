const express = require('express'); 
const db = require('../config/database');
const isAuthenticated = require('../middlewares/auth');

router = express.Router();

//PUT approve the posting
router.put('/approve-posting/:id', isAuthenticated, (req, res) => {
    const jobId = req.params.id; // Get the application ID from the URL parameter
  
    // Validate the application ID
    if (!jobId || isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    const sql = `
      UPDATE job_postings
      SET status = 'approved'
      WHERE job_id = ?
    `;
  
    // Execute the query
    db.query(sql, [jobId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update posting status' });
      }
  
      // Check if any rows were affected
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Posting not found' });
      }
  
      // Return success response
      res.json({ message: 'Posting approved successfully' });
    });
  })

//PUT deny posting
router.put('/deny-posting/:id', isAuthenticated, (req, res) => {
    const jobId = req.params.id; // Get the application ID from the URL parameter
  
    // Validate the application ID
    if (!jobId || isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
  
    const sql = `
      UPDATE job_postings
      SET status = 'denied'
      WHERE job_id = ?
    `;
  
    // Execute the query
    db.query(sql, [jobId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update posting status' });
      }
  
      // Check if any rows were affected
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Posting not found' });
      }
  
      // Return success response
      res.json({ message: 'Posting denied successfully' });
    });
  })

module.exports = router;