const express = require('express'); 
const db = require('../config/database');
const nodemailer = require('nodemailer');
const isAuthenticated = require('../middlewares/auth');

router = express.Router();

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
      user: 'apikey',
      pass: 'SG_API_Key',
  },
});

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

      const selectSql = `SELECT ui.email
      FROM job_postings jp
      JOIN users_info ui ON jp.user_id = ui.id
      WHERE jp.job_id = ?`;


      db.query(selectSql, [jobId], async (error, results) => {
        if (error) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update posting status' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'Posting not found' });
        }
        
        email = results[0].email;

        const mailOptions = {
          from: 'jobconn_fbla@g.northernacademy.org', // Sender address
          to: email, // Recipient address
          subject: ' Your Job Posting Has Been Approved', // Email subject
          html: `
            <p>Dear Recruiter,</p>
            <p>On behalf of our Admin team, we are pleased to inform you that your job posting has been approved and is now live on our platform.</p>
            <p>We appreciate your interest in connecting with talented candidates through JOB CONN. If you have any questions or need further assistance, please feel free to reach out. We are happy to support you in making the most of your recruitment experience.</p>
            <p>Thank you for choosing JOB CONN!</p>
            <p>Best regards,</p>
            <p>Richard Vu</p>
            <p>Admin Team</p>
            <p>JOB CONN</p>
            <p>jobconn_fbla@northernacademy.org</p>
        `, // HTML body
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error('Error sending email:', error);
              return res.status(500).json({ message: 'Failed to send approval email' });
          }

          console.log('Email sent:', info.response);
          res.status(200).json({ message: 'Posting approved successfully', email });
        });
      });
    });
  })

//PUT deny posting
router.put('/deny-posting/:id', isAuthenticated, (req, res) => {
  const jobId = req.params.id; // Get the job ID from the URL parameter

  // Validate the job ID
  if (!jobId || isNaN(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
  }

  const updateSql = `
      UPDATE job_postings
      SET status = 'denied'
      WHERE job_id = ?
  `;

  // Execute the update query
  db.query(updateSql, [jobId], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update posting status' });
      }

      // Check if any rows were affected
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Posting not found' });
      }

      // Fetch the email associated with the job posting
      const selectSql = `
          SELECT ui.email
          FROM job_postings jp
          JOIN users_info ui ON jp.user_id = ui.id
          WHERE jp.job_id = ?
      `;

      db.query(selectSql, [jobId], (error, results) => {
          if (error) {
              console.error('Database error:', error);
              return res.status(500).json({ error: 'Failed to fetch user email' });
          }

          // Check if any results were returned
          if (results.length === 0) {
              return res.status(404).json({ error: 'User email not found' });
          }

          const email = results[0].email; // Get the email from the first row

          // Email content for denial
          const mailOptions = {
              from: 'jobconn_fbla@g.northernacademy.org', // Sender address
              to: email, // Recipient address
              subject: 'Your Job Posting Has Been Denied', // Email subject
              html: `
                  <p>Dear Recruiter,</p>
                  <p>On behalf of our Admin team, we are so sorry to inform you that your job posting has not been approved due to content issues. If you believe that we rejected this job posting by mistake, please respond to this email. We are more than happy to assist you in addressing any concerns or provide additional guidance to ensure your job posting meets the required standards for approval.</p>
                  <p>We appreciate your understanding and cooperation, and we look forward to hearing from you should you wish to resolve this matter.</p>
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
                  return res.status(500).json({ message: 'Failed to send denial email' });
              }

              console.log('Email sent:', info.response);
              res.status(200).json({ message: 'Posting denied successfully', email });
          });
      });
    });
});

module.exports = router;