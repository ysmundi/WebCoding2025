const express = require('express');
const bodyParser = require('body-parser');
const db = require('../config/database');
const isAuthenticated = require('../middlewares/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
      user: 'apikey',
      pass: "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", // Load API key from .env
  },
});

//Check user subscription
router.get('/subscription/:userId', isAuthenticated, (req, res) => {
    const userId = req.params.userId;

    const sql = 'SELECT subscription FROM users_info WHERE id = ?';

    db.query(sql, [userId], (error, result) => {
        if (error) {
            res.status(500).json({message: "Server error"});
        } else {
            if (result.affectedRows === 0) {
                return res.status(404).json({error: 'User not found'});
            } else { // Return success response
                res.status(201).json(result[0]);
            }
        }
    })
});

//Activate standard subscription 
router.put('/subscription-standard/:userId', isAuthenticated, (req, res) => {
    const userId = req.params.userId;

    const sql = 'UPDATE users_info SET subscription = "Standard" WHERE id = ?';

    db.query(sql, [userId], (error, result) => {
        if (error) {
            res.status(500).json({message: "Server error"});
        } else {
            if (result.affectedRows === 0) {
                return res.status(404).json({error: 'User not found'});
            } else {
                // Return success response
                res.status(201).json({message: 'Standard subscription is activated!'});
            }
        }
    })
});

//Acivate value subscription 
router.put('/subscription-value/:userId', isAuthenticated, (req, res) => {
    const userId = req.params.userId;

    const sql = 'UPDATE users_info SET subscription = "Value" WHERE id = ?';

    db.query(sql, [userId], (error, result) => {
        if (error) {
            res.status(500).json({message: "Server error"});
        } else {
            if (result.affectedRows === 0) {
                return res.status(404).json({error: 'User not found'});
            } else {
                // Return success response
                res.status(201).json({message: 'Value subscription is activated!'});
            }
        }
    })
});

//Activate professional subscription 
router.put('/subscription-professional/:userId', isAuthenticated, (req, res) => {
    const userId = req.params.userId;

    const sql = 'UPDATE users_info SET subscription = "Professional" WHERE id = ?';

    db.query(sql, [userId], (error, result) => {
        if (error) {
            res.status(500).json({message: "Server error"});
        } else {
            if (result.affectedRows === 0) {
                return res.status(404).json({error: 'User not found'});
            } else {
                // Return success response
                res.status(201).json({message: 'Professional subscription is activated!'});
            }
        }
    })
});


// POST /recruiter/post-job - Create a new job posting
router.post('/post-job', (req, res) => { //isAuthenticated, 
    const jobData = req.body;

    db.query('INSERT INTO job_postings SET ?', jobData, (err, result) => {
        if (err) {
            console.error('Error creating job posting:', err);
            res.status(500).json({error: 'Failed to create job posting'});
            return;
        } else {
            res.status(201).json({
                message: 'Job posting created successfully',
                jobId: result.insertId
            });
        }
    });
});

//get pending applications
router.get('/pending-job-applications/:jobId', isAuthenticated, (req, res) => {
    const status = 'pending'
    const jobId = req.params.jobId;

    try {
        db.query('SELECT * FROM job_applications WHERE job_id = ? AND status = ?', [jobId, status], (err, results) => {
            res.json(results);
        });
    } catch (err) {
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
    } catch (err) {
        res.status(500).json({error: "Server error"})
    }
})


//Get information about job by its id
router.get('/posting-info/:jobId', (req, res) => { // isAuthenticated,
    const jobId = req.params.jobId;

    try {
        db.query('SELECT * FROM job_postings WHERE job_id = ?', [jobId], (err, results) => {
            res.json(results);
        });
    } catch (err) {
        res.status(500).json({error: "Server error"})
    }
})

//PUT - accept application
router.put('/accept-application/:id', isAuthenticated, (req, res) => {
    const applicationId = req.params.id; // Get the application ID from the URL parameter

  // Validate the application ID
  if (!applicationId || isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
  }

  // SQL query to update the status and approved_date
  const updateSql = `
      UPDATE job_applications
      SET status = 'accepted', approved_date = NOW()
      WHERE application_id = ?
  `;

  // Execute the update query
  db.query(updateSql, [applicationId], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update application status' });
      }

      // Check if any rows were affected
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Application not found' });
      }

      // Fetch the student's email associated with the application
      const selectSql = `
          SELECT ui.email
          FROM job_applications ja
          JOIN users_info ui ON ja.user_id = ui.id
          WHERE ja.application_id = ?
      `;

      db.query(selectSql, [applicationId], (error, results) => {
          if (error) {
              console.error('Database error:', error);
              return res.status(500).json({ error: 'Failed to fetch student email' });
          }

          // Check if any results were returned
          if (results.length === 0) {
              return res.status(404).json({ error: 'Student email not found' });
          }

          const email = results[0].email; // Get the email from the first row

          // Email content for acceptance
          const mailOptions = {
              from: 'jobconn_fbla@g.northernacademy.org', // Sender address
              to: email, // Recipient address
              subject: 'Congratulations! Your Job Application Has Been Accepted', // Email subject
              html: `
                  <p>Dear Student,</p>
                  <p>We are thrilled to inform you that your job application has been accepted! Congratulations on this achievement!</p>
                  <p>This is a great opportunity for you to showcase your skills and grow professionally. The recruiter will be in touch with you shortly to discuss the next steps.</p>
                  <p>If you have any questions or need further assistance, please feel free to reach out to us. We are here to support you throughout this process.</p>
                  <p>Best of luck in your new role!</p>
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
                  return res.status(500).json({ message: 'Failed to send acceptance email' });
              }

              console.log('Email sent:', info.response);
              res.status(200).json({ message: 'Application accepted successfully', email });
          });
      });
  });
});

//PUT reject application 
router.put('/reject-application/:id', isAuthenticated, (req, res) => {
    const applicationId = req.params.id; // Get the application ID from the URL parameter

  // Validate the application ID
  if (!applicationId || isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
  }

  // SQL query to update the status to 'rejected'
  const updateSql = `
      UPDATE job_applications
      SET status = 'rejected'
      WHERE application_id = ?
  `;

  // Execute the update query
  db.query(updateSql, [applicationId], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update application status' });
      }

      // Check if any rows were affected
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Application not found' });
      }

      // Fetch the student's email associated with the application
      const selectSql = `
          SELECT ui.email
          FROM job_applications ja
          JOIN users_info ui ON ja.user_id = ui.id
          WHERE ja.application_id = ?
      `;

      db.query(selectSql, [applicationId], (error, results) => {
          if (error) {
              console.error('Database error:', error);
              return res.status(500).json({ error: 'Failed to fetch student email' });
          }

          // Check if any results were returned
          if (results.length === 0) {
              return res.status(404).json({ error: 'Student email not found' });
          }

          const email = results[0].email; // Get the email from the first row

          // Email content for rejection
          const mailOptions = {
              from: 'jobconn_fbla@g.northernacademy.org', // Sender address
              to: email, // Recipient address
              subject: 'Your Job Application Has Been Rejected', // Email subject
              html: `
                  <p>Dear Student,</p>
                  <p>We regret to inform you that your job application has been rejected. We appreciate the time and effort you invested in applying for this position.</p>
                  <p>While this particular opportunity did not work out, we encourage you to apply for other positions that match your skills and interests. We believe that the right opportunity is out there for you.</p>
                  <p>If you have any questions or would like feedback on your application, please feel free to reach out to us. We are here to support you in your job search journey.</p>
                  <p>Thank you for your understanding, and we wish you the best of luck in your future endeavors.</p>
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
                  return res.status(500).json({ message: 'Failed to send rejection email' });
              }

              console.log('Email sent:', info.response);
              res.status(200).json({ message: 'Application rejected successfully', email });
          });
      });
  });
});

//PUT suspend application 
router.put('/suspend-application/:id', isAuthenticated, (req, res) => {
    const applicationId = req.params.id; // Get the application ID from the URL parameter

  // Validate the application ID
  if (!applicationId || isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
  }

  // SQL query to update the status to 'suspended'
  const updateSql = `
      UPDATE job_applications
      SET status = 'suspended'
      WHERE application_id = ?
  `;

  // Execute the update query
  db.query(updateSql, [applicationId], (err, result) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to update application status' });
      }

      // Check if any rows were affected
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Application not found' });
      }

      // Fetch the student's email associated with the application
      const selectSql = `
          SELECT ui.email
          FROM job_applications ja
          JOIN users_info ui ON ja.user_id = ui.id
          WHERE ja.application_id = ?
      `;

      db.query(selectSql, [applicationId], (error, results) => {
          if (error) {
              console.error('Database error:', error);
              return res.status(500).json({ error: 'Failed to fetch student email' });
          }

          // Check if any results were returned
          if (results.length === 0) {
              return res.status(404).json({ error: 'Student email not found' });
          }

          const email = results[0].email; // Get the email from the first row

          // Email content for suspension
          const mailOptions = {
              from: 'jobconn_fbla@g.northernacademy.org', // Sender address
              to: email, // Recipient address
              subject: 'Your Job Application Has Been Suspended', // Email subject
              html: `
                  <p>Dear Student,</p>
                  <p>We regret to inform you that your job application has been suspended. This decision was made after careful consideration of the current circumstances.</p>
                  <p>If you believe this suspension is in error or have any questions, please feel free to reach out to us. We are here to assist you and provide any necessary clarification.</p>
                  <p>We appreciate your understanding and cooperation during this time. We encourage you to continue exploring other opportunities on our platform.</p>
                  <p>Thank you for your patience, and we wish you the best in your job search.</p>
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
                  return res.status(500).json({ message: 'Failed to send suspension email' });
              }

              console.log('Email sent:', info.response);
              res.status(200).json({ message: 'Application suspended successfully', email });
          });
      });
  });
});

//DELETE job posting 
router.delete('/delete-posting/:jobId', isAuthenticated, (req, res) => {
    const jobId = req.params.jobId; // Get the job ID from the URL parameter

    // Validate the job ID
    if (!jobId || isNaN(jobId)) {
        return res.status(400).json({error: 'Invalid job ID'});
    } else {
        // Start a transaction to ensure atomicity
        db.beginTransaction((err) => {
            if (err) {
                console.error('Transaction error:', err);
                return res.status(500).json({error: 'Failed to start transaction'});
            } else {
                // Step 1: Delete all applications associated with the job ID
                const deleteApplicationsQuery = `
                    DELETE
                    FROM job_applications
                    WHERE job_id = ?
                `;

                db.query(deleteApplicationsQuery, [jobId], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Database error (delete applications):', err);
                            res.status(500).json({error: 'Failed to delete applications'});
                        });
                    } else {
                        // Step 2: Delete the job posting
                        const deletePostingQuery = `
                            DELETE
                            FROM job_postings
                            WHERE job_id = ?
                        `;

                        db.query(deletePostingQuery, [jobId], (err, result) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Database error (delete posting):', err);
                                    res.status(500).json({error: 'Failed to delete posting'});
                                });
                            } else {
                                // Check if the posting was found and deleted
                                if (result.affectedRows === 0) {
                                    return db.rollback(() => {
                                        res.status(404).json({error: 'Posting not found'});
                                    });
                                } else {
                                    // Commit the transaction if everything is successful
                                    db.commit((err) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                console.error('Commit error:', err);
                                                res.status(500).json({error: 'Failed to commit transaction'});
                                            });
                                        } else {
                                            // Return success response
                                            res.json({message: 'Posting and associated applications deleted successfully'});
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }
});


router.get('/limit-job-postings/:userId', async (req, res) => {
    let userId = req.params.userId

    const query = "SELECT subscription FROM users_info WHERE id = ?";
    const count = 'SELECT COUNT(*) AS postings FROM job_postings WHERE user_id = ?';

    db.query(query, [userId], async (error, result) => {
        if (error) {
            res.status(500).json({error: "Server errror"});
        } else {
            if (result === 0) {
                res.status(401).json({message: "User not found"})
            } else {
                const subscription = result[0].subscription;
                db.query(count, [userId], async (err, results) => {
                    const postings = results[0].postings;

                    if (subscription == "Standard") {
                        if (postings >= 3) {
                            res.status(400).json({message: 'Posting is not avaliable your posing is already 3/3'});
                        } else {
                            res.status(200).json({message: "Posting is avaliable"});
                        }
                    } else if (subscription == "Value") {
                        if (postings >= 10) {
                            res.status(400).json({meassage: 'Posting is not avaliable your posing is already 10/10'});
                        } else {
                            res.status(200).json({message: "Posting is avaliable"});
                        }
                    } else if (subscription == "Professional") {
                        res.status(200).json({message: "Posting is avaliable"});
                    } else {
                        res.status(400).json({message: "Posting is not avaliable, subscripe to any of packages"});
                    }
                })
            }
        }
    })
});

module.exports = router;