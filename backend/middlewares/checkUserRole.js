const db = require('../config/database');

const checkUserRole = (req, res, next) => {
    const userId = req.params.userId; // Extract userId from request parameters

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    // Query the database to fetch the user's role
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userRole = results[0].role; // Get the user's role

        // Attach the role to the request object
        req.userRole = userRole;

        // Pass control to the next middleware or route handler
        next();
    });
};

module.exports = checkUserRole;