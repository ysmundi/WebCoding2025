const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');

const router = express.Router();

/**
 * GET /api/jobs/user/:userId
 * Get job postings for a specific user
 */
router.get('/user-jobs/:userId', (req, res) => {
    const userId = req.params.userId;

    db.query('SELECT * FROM job_postings WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user job postings:', err);
            return res.status(500).json({ error: 'Failed to fetch job postings for user.' });
        }
        res.status(200).json(results);
    });
});

/**
 * GET /api/jobs/all-jobs
 * Get all job postings
 */
router.get('/all-jobs', (req, res) => {
    const query = 'SELECT * FROM job_postings';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all job postings:', err);
            return res.status(500).json({ error: 'Failed to fetch all job postings.' });
        }
        res.status(200).json(results);
    });
});

/**
 * PUT /api/jobs/update-job/:jobId
 * Update job status (admin-only operation)
 */
router.put('/update-job/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const newStatus = req.body.status; // Expected values: 'approved', 'denied'

    if (!newStatus) {
        return res.status(400).json({ error: 'Status is required.' });
    }

    // Ensure only authorized admins can perform this action (authorization check not implemented)
    db.query('UPDATE job_postings SET status = ? WHERE job_id = ?', [newStatus, jobId], (err, result) => {
        if (err) {
            console.error('Error updating job status:', err);
            return res.status(500).json({ error: 'Failed to update job status.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job posting not found.' });
        }

        res.status(200).json({ message: 'Job posting status updated successfully.' });
    });
});

/**
 * GET /api/jobs/pending-jobs
 * Get all pending job postings
 */
router.get('/pending-jobs', (req, res) => {
    const query = "SELECT * FROM job_postings WHERE status = 'pending'";

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching pending job postings:', err);
            return res.status(500).json({ error: 'Failed to fetch pending job postings.' });
        }
        res.status(200).json(results);
    });
});

/**
 * GET /api/jobs/application-info/:applicationId
 * Get application details by application ID
 */
router.get('/application-info/:applicationId', (req, res) => {
    const applicationId = req.params.applicationId;

    db.query('SELECT * FROM job_applications WHERE application_id = ?', [applicationId], (err, results) => {
        if (err) {
            console.error('Error fetching application details:', err);
            return res.status(500).json({ error: 'Failed to fetch application details.' });
        }
        if (results.length === 0) { 
            return res.status(404).json({ error: 'Application not found.' });
        }
        res.status(200).json(results);
    });
});

// Export the router
module.exports = router;
