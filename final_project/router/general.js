const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Task 6: Register a new user
public_users.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!isValid(username)) {
        return res.status(400).json({ message: "Username must be 3-20 characters (letters, numbers, underscores)" });
    }

    if (users.some(user => user.username === username)) {
        return res.status(400).json({ message: "Username already exists" });
    }

    users.push({ username, password });
    return res.status(201).json({ message: "User registered successfully" });
});

// Task 1: Get all books
public_users.get('/', function (req, res) {
    return res.status(200).json(JSON.stringify(books, null, 2));
});

// Task 2: Get book by ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];
    
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }
    return res.status(200).json(book);
});

// Task 3: Get books by author
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;
    const matchingBooks = [];
    
    for (const isbn in books) {
        if (books[isbn].author.toLowerCase().includes(author.toLowerCase())) {
            matchingBooks.push(books[isbn]);
        }
    }
    
    if (matchingBooks.length === 0) {
        return res.status(404).json({ message: "No books found by this author" });
    }
    return res.status(200).json(matchingBooks);
});

// Task 4: Get books by title
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
    const matchingBooks = [];
    
    for (const isbn in books) {
        if (books[isbn].title.toLowerCase().includes(title.toLowerCase())) {
            matchingBooks.push(books[isbn]);
        }
    }
    
    if (matchingBooks.length === 0) {
        return res.status(404).json({ message: "No books found with this title" });
    }
    return res.status(200).json(matchingBooks);
});

// Task 5: Get reviews by ISBN
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];
    
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }
    
    if (!book.reviews || Object.keys(book.reviews).length === 0) {
        return res.status(404).json({ message: "No reviews found for this book" });
    }
    
    return res.status(200).json(book.reviews);
});

module.exports.general = public_users;