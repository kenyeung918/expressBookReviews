const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const helmet = require('helmet'); // Added for security headers
const rateLimit = require('express-rate-limit'); // Added for rate limiting
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit JSON payload size

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});

// Session configuration with enhanced security
app.use("/customer", session({
    secret: process.env.SESSION_SECRET || "fingerprint_customer",
    resave: false, // Changed to false to prevent race conditions
    saveUninitialized: false, // Don't save unmodified sessions
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent client-side JS access
        maxAge: 60 * 60 * 1000, // 1 hour
        sameSite: 'strict' // CSRF protection
    }
}));

// JWT Authentication Middleware with enhanced error handling
app.use("/customer/auth/*", authLimiter, function auth(req, res, next) {
    // Check if session exists
    if (!req.session?.authorization?.accessToken) {
        return res.status(401).json({ 
            message: "Authentication required",
            action: "Please login at /customer/login"
        });
    }

    const token = req.session.authorization.accessToken;
    
    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET || "fingerprint_customer", (err, decoded) => {
        if (err) {
            return res.status(403).json({ 
                message: "Invalid token",
                error: err.name === 'TokenExpiredError' ? 
                    'Token expired' : 'Invalid token',
                solution: 'Please login again'
            });
        }
        
        // Attach user data to request
        req.user = decoded;
        next();
    });
});

// Routes
app.use("/customer", customer_routes);
app.use("/", genl_routes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});