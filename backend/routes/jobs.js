const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');

const router = express.Router();

// POST /api/jobs - Create a new job posting
router.post('/api/jobs', (req, res) => {
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
  
  // GET /api/jobs - Get all job postings (for admin with DataTables)
  router.get('/api/jobs', (req, res) => {
    // Implement DataTables server-side processing:
    // 1. Get parameters: draw, start, length, search, order
    const draw = req.query.draw;
    const start = parseInt(req.query.start, 10);
    const length = parseInt(req.query.length, 10);
    const searchValue = req.query.search.value;
    const orderColumn = req.query['order[0][column]'];
    const orderDir = req.query['order[0][dir]'];
  
    // 2. Build the SQL query
    let sql = `
      SELECT 
        jp.*, 
        u.username AS posted_by 
      FROM 
        job_postings jp
      JOIN 
        users u ON jp.user_id = u.user_id
      WHERE 
        jp.position_name LIKE ? OR 
        jp.organization_name LIKE ? OR
        u.username LIKE ?
      ORDER BY 
        ${orderColumn} ${orderDir}
      LIMIT ?, ?
    `;
  
    let countSql = `
      SELECT COUNT(*) AS total 
      FROM job_postings jp
      JOIN users u ON jp.user_id = u.user_id
      WHERE 
        jp.position_name LIKE ? OR 
        jp.organization_name LIKE ? OR
        u.username LIKE ?
    `;
  
    const searchParam = `%${searchValue}%`;
  
    // 3. Execute the queries
    db.query(countSql, [searchParam, searchParam, searchParam], (err, countResult) => {
      if (err) {
        // ... handle error
      }
  
      const totalCount = countResult[0].total;
  
      db.query(sql, [searchParam, searchParam, searchParam, start, length], (err, results) => {
        if (err) {
          console.error('Error fetching job postings:', err);
          res.status(500).json({ error: 'Failed to fetch job postings' });
          return;
        }
        // 4. Send DataTables response
        res.json({
          draw: parseInt(draw),
          recordsTotal: totalCount,
          recordsFiltered: totalCount, // You might need to adjust this based on filtering
          data: results
        });
      });
    });
  });
  
  // GET /api/jobs/user/:userId - Get job postings for a specific user
router.get('/api/jobs/user/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT * FROM job_postings WHERE user_id = ?', [userId], (err, results) => {
      // ... error handling ...
      res.json(results);
    });
  });
  
  // PUT /api/jobs/:jobId - Update job status (admin)
router.put('/api/jobs/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const newStatus = req.body.status; // 'approved', 'denied'
    // ... (Add authorization to ensure only admins can update) ...
  
    db.query('UPDATE job_postings SET status = ? WHERE job_id = ?', [newStatus, jobId], (err, result) => {
      // ... error handling ...
      res.json({ message: 'Job posting status updated' });
    });
  });
  
  // ... other routes for getting job details, etc. ...
  
  // Error handling middleware (add after other routes)
  module.exports = router;
