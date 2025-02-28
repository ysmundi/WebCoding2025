const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('../config/database');


const router = express.Router();
router.use(express.json());

//Register new user
router.post('/register', async (req, res) => {
  console.log("registering user");
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
        user_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ message: 'Email or username already exists' });
          }
          return res.status(500).send({ message: 'Server error' });
        }
        res.status(201).send({ message: 'User registered successfully', user: req.session.user });
      }
    );
  } catch (error) {
    res.status(500).send({ message: 'Server error' });
  }
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