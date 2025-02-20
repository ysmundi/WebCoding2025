const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const db = require('../config/database');

const router = express.Router();
router.use(express.json());

// Session store using MySQL
const sessionStore = new MySQLStore({}, db);

router.use(
  session({
    key: 'session_cookie_name', // Cookie name
    secret: 'your_secret_key', // Secret for signing the session ID cookie
    store: sessionStore, // Use MySQL as the session store
    resave: false, // Prevent resaving unchanged sessions
    saveUninitialized: false, // Don't save uninitialized sessions
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true, // Prevent access via JavaScript
      secure: false, // Set true if using HTTPS
    },
  })
);

/**
 * @route POST /register
 * @desc Register a new user
 */
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password are required' });
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
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ message: 'Email already exists' });
          }
          return res.status(500).send({ message: 'Server error' });
        }
        res.status(201).send({ message: 'User registered successfully' });
      }
    );
  } catch (error) {
    res.status(500).send({ message: 'Server error' });
  }
});

/**
 * @route POST /login
 * @desc Log in a user and store their session
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: 'Email and password are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({ message: 'Invalid email format' });
  }

  // Query the user from the database
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, results) => {
      if (err) return res.status(500).send({ message: 'Server error' });
      if (results.length === 0) return res.status(401).send({ message: 'Invalid email or password' });

      const user = results[0];

      // Compare the hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return res.status(401).send({ message: 'Invalid email or password' });

      // Save the user ID in the session
      req.session.userId = user.id;
      res.status(200).send({ message: 'Login successful' });
    }
  );
});

/**
 * @route GET /user
 * @desc Get the logged-in user's details
 */
router.get('/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send({ message: 'Not authenticated' });
  }

  // Query the user from the database using the session userId
  db.query(
    'SELECT email FROM users WHERE id = ?',
    [req.session.userId],
    (err, results) => {
      if (err) return res.status(500).send({ message: 'Server error' });
      if (results.length === 0) return res.status(404).send({ message: 'User not found' });

      const user = results[0];
      res.status(200).send({ email: user.email });
    }
  );
});

/**
 * @route POST /logout
 * @desc Log out the user and destroy their session
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send({ message: 'Logout failed' });
    res.clearCookie('session_cookie_name'); // Clear the session cookie
    res.status(200).send({ message: 'Logout successful' });
  });
});

module.exports = router;
