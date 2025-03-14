CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    username TEXT NOT NULL
    password TEXT NOT NULL
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    summary TEXT,
    book_values TEXT,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    book_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);