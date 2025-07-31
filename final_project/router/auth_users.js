const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    // Returns true if username:
    // 1. Is 3-20 characters long
    // 2. Contains only letters, numbers, and underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

const authenticatedUser = (username, password) => {
    // Check if username and password match any registered user
    return users.some(user => user.username === username && user.password === password);
};

// Registered users login
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({message: "Username and password are required"});
    }

    if (!isValid(username)) {
        return res.status(400).json({
            message: "Invalid username format",
            requirements: "3-20 characters, letters/numbers/underscores only"
        });
    }

    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign(
            { username: username },
            'secretKey', // In production, use process.env.JWT_SECRET
            { expiresIn: '1h' }
        );

        req.session.authorization = { accessToken, username };
        return res.status(200).json({
            message: "Login successful",
            token: accessToken
        });
    } else {
        return res.status(401).json({message: "Invalid credentials"});
    }
});

// Add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;
    const username = req.session.authorization.username;

    if (!review) {
        return res.status(400).json({message: "Review content is required"});
    }

    if (!books[isbn]) {
        return res.status(404).json({message: "Book not found"});
    }

    // Initialize reviews object if it doesn't exist
    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    // Add or update the review
    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: "Review submitted successfully",
        book: books[isbn]
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
