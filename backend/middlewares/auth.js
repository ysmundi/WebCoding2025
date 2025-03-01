// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        // User is authenticated, proceed to the next middleware/route handler
        next();
    } else {
        // User is not authenticated
        res.status(401).json({error: 'Unauthorized'});
    }
}

// Export the middleware
module.exports = isAuthenticated;
