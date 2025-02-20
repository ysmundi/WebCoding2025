const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');

router = express.Router();

//POST change the status of the job 
router.get('/all-jobs', (req, res) => {
    console.log("method is called");
    const query = 'SELECT * FROM job_postings';
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error while querying the database:', err); // Log the error for debugging
        return res.status(500).json({ error: 'Database query failed' }); // Respond with an error
      }
      console.log(results); // Log results if successful
      res.json(results); // Send results to the client
    });
  });

module.exports = router;