const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');
const isAuthenticated = require('../middlewares/auth');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
      user: 'apikey',
      pass: "SG_API_Key", // Load API key from .env
  },
});

router = express.Router();

//POST apply for a job 
router.post('/apply', isAuthenticated, (req, res) => {
  const { job_id, user_id, username, email, phone_number, about_you } = req.body;

  // Validate input
  if (!job_id || !user_id || !username || !email) {
      return res.status(400).json({ error: 'Job ID, User ID, username, and Email are required.' });
  }

  const insertQuery = `
      INSERT INTO job_applications (job_id, user_id, username, email, phone_number, about_you)
      VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Insert the job application
  db.query(insertQuery, [job_id, user_id, username, email, phone_number, about_you], (error, result) => {
      if (error) {
          console.error('Error applying for job:', error);
          return res.status(500).json({ error: 'Failed to apply for job' });
      }

      // Fetch the recruiter's email associated with the job posting
      const selectQuery = `
          SELECT ui.email
          FROM job_postings jp
          JOIN users_info ui ON jp.user_id = ui.id
          WHERE jp.job_id = ?
      `;

      db.query(selectQuery, [job_id], (error, results) => {
          if (error) {
              console.error('Database error:', error);
              return res.status(500).json({ error: 'Failed to fetch recruiter email' });
          }

          // Check if any results were returned
          if (results.length === 0) {
              return res.status(404).json({ error: 'Recruiter email not found' });
          }

          const recruiterEmail = results[0].email; // Get the recruiter's email

          // Email content for recruiter notification
          const mailOptions = {
              from: 'jobconn_fbla@g.northernacademy.org', // Sender address
              to: recruiterEmail, // Recipient address
              subject: 'New Job Application Received', // Email subject
              html: `
                  <p>Dear Recruiter,</p>
                  <p>We are pleased to inform you that a new applicant has applied for your job posting. Please log in to our platform to review the application.</p>
                  <p>To view the application, visit: <a href="https://jobconn.northernhorizon.org/">https://jobconn.northernhorizon.org/</a></p>
                  <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                  <p>Best regards,</p>
                  <p>Richard Vu</p>
                  <p>Admin Team</p>
                  <p>JOB CONN</p>
                  <p>jobconn_fbla@northernacademy.org</p>
              `, // HTML body
          };

          // Send the email
          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                  console.error('Error sending email:', error);
                  return res.status(500).json({ message: 'Failed to send recruiter notification email' });
              }

              console.log('Email sent:', info.response);
              res.status(201).json({ message: 'Application submitted successfully', application_id: result.insertId });
          });
      });
  });
});
//get applications by id 
router.get('/applications/:userId', isAuthenticated, (req, res) => {
  const userId = req.params.userId;

  try {
      db.query('SELECT * FROM job_applications WHERE user_id = ?', [userId], (err, results) => {
          res.json(results);
        });
  }
  catch(err) {
      res.status(500).json({error: "Server error"})
  }
});

//Get the user information
router.get('/student-info/:userId', isAuthenticated, (req, res) => { //
  const userId = req.params.userId;

  try {
      db.query('SELECT * FROM users_info WHERE id = ?', [userId], (err, results) => {
          res.json(results[0]);
        });
  }
  catch(err) {
      res.status(500).json({error: "Server error"})
  }
});

router.put('/edit-profile/:userId', isAuthenticated, (req, res) => { //isAuthenticated, 
  const userId = req.params.userId;
  const { first_name, last_name, date_of_birth, education, current_residence, language, job_type, bio } = req.body;

  const query = `UPDATE users_info
    SET
    first_name = ?,
    last_name = ?,
    date_of_birth = ?,
    education = ?,
    current_residence = ?,
    language = ?,
    job_type = ?,
    bio =?
    WHERE
    id = ?;`

    db.query(query, [first_name, last_name, date_of_birth, education, current_residence, language, job_type, bio, userId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: `Failed to update user's info` });
      } 
      if (result === 0) {
        console.log("User not found");
        return res.status(404).json({ message: "User not found"});
      }
      res.json({ message: `User's data saved` });
    })
})



module.exports = router;