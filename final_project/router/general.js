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

// Task 10: Get all books using async/await
public_users.get('/', async function (req, res) {
    try {
      // Create a promise-based function to simulate async operation
      const fetchAllBooks = () => new Promise((resolve) => {
        // Simulate async database/API call
        setTimeout(() => resolve(books), 100);
      });

  
      // Using async/await to handle the promise
      const bookList = await fetchAllBooks();
      
      return res.status(200).json({
        message: "Books retrieved successfully",
        books: JSON.parse(JSON.stringify(bookList)) // Ensure clean object
      });
      
    } catch (error) {
      return res.status(500).json({
        message: "Error retrieving books",
        error: error.message
      });
    }
  });
  
// Task 1: Get all books
public_users.get('/', function (req, res) {
    return res.status(200).json(JSON.stringify(books, null, 2));
});

// Task 11: Get book by ISBN using async/await with Axios
public_users.get('/isbn/:isbn', async function (req, res) {
    try {
        const isbn = req.params.isbn;
        
        // Create a promise-based function to simulate async database/API call
        const getBookByISBN = (isbn) => new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate async delay
                const book = books[isbn];
                if (book) {
                    resolve(book);
                } else {
                    reject(new Error('Book not found'));
                }
            }, 100);
        });
     
        // Using async/await to handle the promise
        const book = await getBookByISBN(isbn);
        
        return res.status(200).json({
            message: "Book retrieved successfully",
            book: book
        });
        
    } catch (error) {
        return res.status(404).json({
            message: error.message,
            available_isbns: Object.keys(books) // Show available ISBNs
        });
    }
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

// Task 12: Get books by author using async/await
public_users.get('/author/:author', async function (req, res) {
    try {
        const author = req.params.author.toLowerCase();
        
        // Create a promise-based function to simulate async search
        const findBooksByAuthor = (authorName) => new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate async operation
                const results = [];
                for (const isbn in books) {
                    if (books[isbn].author.toLowerCase().includes(authorName)) {
                        results.push({
                            isbn: isbn,
                            ...books[isbn]
                        });
                    }
                }
                if (results.length > 0) {
                    resolve(results);
                } else {
                    reject(new Error('No books found by this author'));
                }
            }, 100);
        });

        // Using async/await to handle the promise
        const matchingBooks = await findBooksByAuthor(author);
        
        return res.status(200).json({
            message: "Books found successfully",
            count: matchingBooks.length,
            books: matchingBooks
        });
        
    } catch (error) {
        return res.status(404).json({
            message: error.message,
            suggestion: "Try searching with a different author name"
        });
    }
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

// Task 13: Get books by title using async/await
public_users.get('/title/:title', async function (req, res) {
    try {
        const title = req.params.title.toLowerCase();
        
        // Create promise-based function to simulate async search
        const findBooksByTitle = (titleQuery) => new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate async operation
                const results = [];
                for (const isbn in books) {
                    if (books[isbn].title.toLowerCase().includes(titleQuery)) {
                        results.push({
                            isbn: isbn,
                            ...books[isbn],
                            matchStrength: calculateMatchStrength(books[isbn].title, titleQuery)
                        });
                    }
                }
                results.length > 0 ? resolve(results) : reject(new Error('No books found with this title'));
            }, 100);
        });

        // Helper function to calculate match relevance
        const calculateMatchStrength = (bookTitle, searchTerm) => {
            return bookTitle.toLowerCase().indexOf(searchTerm.toLowerCase());
        };

        // Using async/await to handle the promise
        const matchingBooks = await findBooksByTitle(title);
        
        // Sort by match strength (closer matches first)
        matchingBooks.sort((a, b) => a.matchStrength - b.matchStrength);
        
        return res.status(200).json({
            message: "Books found successfully",
            searchTerm: title,
            count: matchingBooks.length,
            books: matchingBooks.map(book => {
                const { matchStrength, ...bookData } = book;
                return bookData;
            })
        });
        
    } catch (error) {
        return res.status(404).json({
            message: error.message,
            suggestion: "Try a different title or partial title"
        });
    }
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