const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // For security headers
const compression = require('compression'); // For Gzip compression
const rateLimit = require('express-rate-limit'); // For rate limiting
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // For password hashing
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const isDevelopment = process.env.NODE_ENV !== 'production';
const getEnv = (name) => (process.env[name] || '').trim();

const cloudinaryConfig = {
    cloud_name: getEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: getEnv('CLOUDINARY_API_KEY'),
    api_secret: getEnv('CLOUDINARY_API_SECRET')
};

// Validate Cloudinary Config
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    console.error('CRITICAL: One or more Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing');
}

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting to prevent brute-force attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter); // Apply to all API routes

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Cloudinary Configuration
cloudinary.config({
    ...cloudinaryConfig,
    secure: true
});

if (isDevelopment) {
    console.log('Cloudinary configuration loaded', {
        cloud_name: cloudinaryConfig.cloud_name,
        has_api_key: Boolean(cloudinaryConfig.api_key),
        has_api_secret: Boolean(cloudinaryConfig.api_secret)
    });
}

// Cache Control: Ensure API responses are never cached by the browser
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// MongoDB Connection
const MONGO_URI = getEnv('MONGO_URI');

if (!MONGO_URI) {
    throw new Error('Missing MONGO_URI in Backend/.env');
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.error('MongoDB connection error:', err));
 
// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use('/uploads', express.static(uploadDir));

// Serve Frontend and Admin static files for "Live" deployment
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use('/admin-panel', express.static(path.join(__dirname, '../Admin')));

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'MARIDADI_SECURE_2026'; // Changed to a more specific key

// Compression middleware
app.use(compression());

// Middleware to verify JWT
const { authenticateToken } = require('./Middleware/authMiddleware');
const { getErrorMessage } = require('./utils/helpers');
const User = require('./Models/User'); // Moved to top level

// Import Routes
const authRoutes = require('./Routes/authRoutes');
const adminDashboardRoutes = require('./Routes/adminDashboardRoutes');
const sermonRoutes = require('./Routes/sermonRoutes');
const eventRoutes = require('./Routes/eventRoutes');
const announcementRoutes = require('./Routes/announcementRoutes');
const blogRoutes = require('./Routes/blogRoutes');
const galleryRoutes = require('./Routes/galleryRoutes');
const prayerRoutes = require('./Routes/prayerRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const donationRoutes = require('./Routes/donationRoutes'); // New
const ministryRoutes = require('./Routes/ministryRoutes'); // New
const memberRoutes = require('./Routes/memberRoutes'); // New
const testimonialRoutes = require('./Routes/testimonialRoutes'); // New

// Authentication Endpoints
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (user && bcrypt.compareSync(password, user.password)) {
            const accessToken = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            return res.json({ token: accessToken, role: user.role });
        }
        res.status(401).json({ message: 'Invalid username or password' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/api/admin/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        
        // User is already required at the top level
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, username, password: hashedPassword, role: 'Admin' }); // Default to Admin for this endpoint
        
        res.status(201).json({ message: 'Administrator account created successfully' });
    } catch (err) {
        console.error('Registration failed:', err);
        res.status(500).json({ message: 'Registration failed', error: getErrorMessage(err) });
    }
});

// Apply authentication middleware to all admin routes (except login/register)
app.use('/api/admin', authenticateToken); // This should be placed before any admin routes are used.

// Use Routes
app.use('/api/auth', authRoutes); // For login/register (public)
app.use('/api/admin-dashboard', adminDashboardRoutes); // Admin dashboard stats
app.use('/api/sermons', sermonRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/prayer-requests', prayerRoutes);
app.use('/api/contact-messages', messageRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ministries', ministryRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/testimonials', testimonialRoutes);

app.use((err, req, res, next) => { // Centralized error handling middleware
    const message = getErrorMessage(err);
    console.error('API error:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        message: err.message || 'Server error',
        error: message
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});
