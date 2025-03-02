const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const router = express.Router();
router.use(express.json());

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
      user: 'apikey',
      pass: 'dddddddddd', // Load API key from .env
  },
});

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// Route: Register User
router.post('/register', async (req, res) => {
  console.log('Registering user');
  const {
    first_name,
    last_name,
    phone_number,
    current_residence,
    date_of_birth,
    pronoun,
    email,
    username,
    password,
    user_type,
  } = req.body;

  // Validate required fields
  if (
    !first_name ||
    !last_name ||
    !email ||
    !username ||
    !password ||
    !user_type
  ) {
    return res.status(400).send({ message: 'All required fields must be provided' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({ message: 'Invalid email format' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);


    // Generate a verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    // Insert the user into the database
    db.query(
      `INSERT INTO users_info (
        first_name,
        last_name,
        phone_number,
        current_residence,
        date_of_birth,
        pronoun,
        email,
        username,
        password_hash,
        user_type,
        verificationCode,
        verificationCodeExpiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        phone_number,
        current_residence,
        date_of_birth,
        pronoun,
        email,
        username,
        hashedPassword,
        user_type,
        verificationCode,
        verificationCodeExpiry,
      ],
      (err, results) => {
        if (err) {
          console.log(err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ message: 'Email or username already exists' });
          }
          
          return res.status(500).send({ message: 'Server error' });

        }

        // Send the verification email
        const mailOptions = {
          from: 'jobconn_fbla@g.northernacademy.org', // Sender address
          to: email, // Recipient address
          subject: 'Verify Your Email', // Email subject
          html: `<p>Your verification code is: <b>${verificationCode}</b></p>`, // HTML body
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send({ message: 'Failed to send verification email' });
          }

          console.log('Email sent:', info.response);
          res.status(201).send({ email: email});
        });
      }
    );
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: 'Server error' });
  }
});

// Route: Verify Email Code
router.post('/verify-email', (req, res) => {
  const { email, code } = req.body;

  // Find the user by email and check the verification code
  const query = 'SELECT * FROM users_info WHERE email = ? AND verificationCode = ? AND verificationCodeExpiry > NOW()';
  db.query(query, [email, code], (error, results) => {
    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).send({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(400).send({ message: 'Invalid or expired code' });
    }

    // Mark the user as verified
    const updateQuery = 'UPDATE users_info SET verificationCode = NULL, verificationCodeExpiry = NULL WHERE email = ?';
    db.query(updateQuery, [email], (error) => {
      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).send({ message: 'Server error' });
      }

      res.status(200).send({ message: 'Email verified successfully' });
    });
  });
});

// Route: Forgot Password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  // Find the user by email
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (error, results) => {
    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    // Generate a reset token and expiry time (1 hour from now)
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save the reset token and expiry time in the database
    const updateQuery = 'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?';
    db.query(updateQuery, [resetToken, resetTokenExpiry, user.id], (error) => {
      if (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Database error' });
      }

      // Send the reset email
      const resetLink = `http://10.11.20.195:3000/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: 'your-email@gmail.com', // Sender address
        to: email, // Recipient address
        subject: 'Password Reset Request', // Email subject
        html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>`, // HTML body
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Failed to send email' });
        }

        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Password reset email sent' });
      });
    });
  });
});

// Route: Reset Password
router.post('/reset-password', (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  // Validate passwords
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  // Find the user by reset token and check if the token is still valid
  const query = 'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > NOW()';
  db.query(query, [token], (error, results) => {
    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = results[0];

    // Hash the new password
    bcrypt.hash(newPassword, 10, (error, hash) => {
      if (error) {
        console.error('Error hashing password:', error);
        return res.status(500).json({ error: 'Failed to hash password' });
      }

      // Update the user's password and clear the reset token
      const updateQuery = 'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?';
      db.query(updateQuery, [hash, user.id], (error) => {
        if (error) {
          console.error('Error updating user:', error);
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json({ message: 'Password reset successful' });
      });
    });
  });
});

//Log in user 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required' });
    }

    // Validate email format


    // Query the user from the database
    db.query(
        'SELECT * FROM users_info WHERE email = ?',
        [email],
        async (err, results) => {
        if (err) return res.status(500).send({ message: 'Server error'});
        if (results.length === 0) return res.status(401).send({ message: 'Invalid email or password' });

        const user = results[0];

        // Compare the hashed password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) return res.status(401).send({ message: 'Invalid email or password' });

        // Save the user ID in the session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.user_type
        };
        res.status(200).send({ message: 'Login successful',  user: req.session.user});
        }
    );
    });

//Get user information
router.get('/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send({ message: 'Not authenticated' });
  }

  // Query the user from the database using the session userId
  db.query(
    'SELECT * FROM users_info WHERE id = ?',
    [req.session.userId],
    (err, results) => {
      if (err) return res.status(500).send({ message: 'Server error' });
      if (results.length === 0) return res.status(404).send({ message: 'User not found' });

      const user = results[0];
      // Exclude sensitive data like password hashes
      const userData = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        current_residence: user.current_residence,
        date_of_birth: user.date_of_birth,
        pronoun: user.pronoun,
        email: user.email,
        username: user.username,
        user_type: user.user_type,
      };
      res.status(200).send(userData);
    }
  );
});

//Log out user 
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send({ message: 'Logout failed' });
    res.clearCookie('session_cookie_name'); // Clear the session cookie
    res.status(200).send({ message: 'Logout successful' });
  });
});

// Server-side (Node.js/Express)
router.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Send user data from the session
    res.json({ user: req.session.user });
});



module.exports = router;