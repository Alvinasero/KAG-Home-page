CREATE DATABASE IF NOT EXISTS kag_maridadi;
USE kag_maridadi;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('Admin', 'Member') DEFAULT 'Member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sermons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    speaker VARCHAR(100),
    video_url VARCHAR(255),
    description TEXT,
    upload_date DATE
);

-- Gallery Table: Supports categorized albums
CREATE TABLE gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    album_name VARCHAR(100),
    image_path VARCHAR(255),
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events Table: For the upcoming calendar
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255),
    description TEXT,
    image_poster VARCHAR(255), -- Path to the event flyer
    is_featured BOOLEAN DEFAULT FALSE
);

-- Blog/News Table
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author_id INT,
    title VARCHAR(255),
    content LONGTEXT,
    category VARCHAR(50),
    image VARCHAR(255),
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Announcements Table: For the homepage newsfeed
CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prayer_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_name VARCHAR(100),
    phone_number VARCHAR(15),
    request_type ENUM('Private', 'Public') DEFAULT 'Private',
    message TEXT NOT NULL,
    status ENUM('Pending', 'Prayed For') DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100),
    subject VARCHAR(200),
    message TEXT,
    status ENUM('New', 'Replied') DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Donations Table
CREATE TABLE donations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    donor_name VARCHAR(255) DEFAULT 'Anonymous',
    email VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_method ENUM('M-Pesa', 'PayPal', 'Card') NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    purpose ENUM('Tithe', 'Offering', 'Building Fund', 'Missions', 'Other') DEFAULT 'Other',
    status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ministries Table
CREATE TABLE ministries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    leader VARCHAR(255),
    description TEXT,
    meeting_schedule VARCHAR(255),
    image_url VARCHAR(255),
    category ENUM('Men', 'Women', 'Youth', 'Children', 'Worship', 'Media', 'Evangelism', 'Other') DEFAULT 'Other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members Table
CREATE TABLE members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE, -- Link to users table if they have an account
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    address VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    membership_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive', 'Pending') DEFAULT 'Pending',
    volunteer_interests TEXT, -- Comma-separated or JSON string
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Testimonials Table
CREATE TABLE testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author_name VARCHAR(255) NOT NULL,
    author_title VARCHAR(255),
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
