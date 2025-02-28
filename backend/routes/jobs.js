const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');
const isAuthenticated = require('../middlewares/auth');

const router = express.Router();

//Get user's job by his/her id
router.get('/user-jobs/:userId', isAuthenticated, (req, res) => {
    const userId = req.params.userId;

    db.query('SELECT * FROM job_postings WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user job postings:', err);
            return res.status(500).json({ error: 'Failed to fetch job postings for user.' });
        }
        res.status(200).json(results);
    });
});

//Get all jobs for students (only approved)
router.get('/all-jobs', isAuthenticated, (req, res) => {
    const query = 'SELECT * FROM job_postings WHERE status = "approved"';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all job postings:', err);
            return res.status(500).json({ error: 'Failed to fetch all job postings.' });
        }
        res.status(200).json(results);
    });
});


//Get pending jobs
router.get('/pending-jobs', isAuthenticated, (req, res) => {
    const query = "SELECT * FROM job_postings WHERE status = 'pending'";

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching pending job postings:', err);
            return res.status(500).json({ error: 'Failed to fetch pending job postings.' });
        }
        res.status(200).json(results);
    });
});

//Get application by application id
router.get('/application-info/:applicationId', isAuthenticated, (req, res) => {
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
