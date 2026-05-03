const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Added for JWT authentication
const bcrypt = require('bcrypt');
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
app.use(cors()); // Allows Admin and Frontend to talk to this server
// Increased body limits for larger file uploads (e.g., videos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Allows handling of standard form submissions


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

// Database Schemas & Models
const Sermon = mongoose.model('Sermon', new mongoose.Schema({
    title: { type: String, required: true },
    video_url: { type: String, required: true },
    speaker: String,
    category: String,
    description: String,
    created_at: { type: Date, default: Date.now }
}));

const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Admin' }
}));

const Prayer = mongoose.model('Prayer', new mongoose.Schema({
    member_name: String,
    phone_number: String,
    request_type: String,
    message: String,
    status: { type: String, default: 'Pending' },
    created_at: { type: Date, default: Date.now }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    content: String,
    status: { type: String, default: 'Unread' },
    created_at: { type: Date, default: Date.now }
}));

const Event = mongoose.model('Event', new mongoose.Schema({
    title: String,
    event_date: Date,
    event_time: String,
    location: String,
    description: String,
    is_featured: { type: Boolean, default: false },
    image_poster: String
}));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}));

const Blog = mongoose.model('Blog', new mongoose.Schema({
    title: String,
    category: String,
    content: String,
    image: String,
    published_at: { type: Date, default: Date.now }
}));

const Gallery = mongoose.model('Gallery', new mongoose.Schema({
    image_path: String,
    caption: String,
    category: String
}));

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // No token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        req.user = user;
        next();
    });
};

// Authentication Endpoints
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // First check database for registered users
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
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
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, username, password: hashedPassword });
        
        res.status(201).json({ message: 'Administrator account created successfully' });
    } catch (err) {
        console.error('Registration failed:', err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

// Password Recovery Helper
app.get('/api/admin/recovery-info', (req, res) => {
    res.json({ 
        message: 'Administrator credentials are currently managed in the backend configuration.',
        supportEmail: 'tech-support@kagmaridadi.org'
    });
});

// Upload Endpoint
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: 'kag_maridadi',
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        use_filename: true,
        unique_filename: true
    }),
});

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const createUpload = ({ allowedMimeTypes, maxFileSize }) => multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);

        const err = new Error(`Unsupported file type: ${file.mimetype}`);
        err.status = 400;
        return cb(err);
    }
});

const getErrorMessage = (err, fallback = 'Server error') => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (err.message) return err.message;

    try {
        return JSON.stringify(err);
    } catch {
        return fallback;
    }
};

const getUploadErrorStatus = (err) => {
    if (err && err.status) return err.status;
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return 400;
    return 500;
};

const getUploadedFileUrl = (file) => {
    const url = file && (file.secure_url || file.path);
    if (!url || !url.startsWith('https://')) {
        throw new Error('Cloudinary upload did not return a secure URL');
    }
    return url;
};

const isCloudinarySecureUrl = (url) => (
    typeof url === 'string' &&
    url.startsWith('https://res.cloudinary.com/')
);

const uploadSingle = (fieldName, options) => (req, res, next) => {
    const upload = createUpload(options);

    upload.single(fieldName)(req, res, (err) => {
        if (!err) {
            if (isDevelopment) {
                console.log(`Upload successful for ${fieldName}:`, req.file ? (req.file.secure_url || req.file.path) : 'No file data');
            }
            return next();
        }

        const message = getErrorMessage(err, 'File upload failed');
        console.error(`Upload middleware failed for ${fieldName}:`, err);
        return res.status(getUploadErrorStatus(err)).json({ message: 'File upload failed', error: message });
    });
};

// Apply authentication middleware to all admin routes
app.use('/api/admin', authenticateToken);

app.post('/api/admin/cloudinary-signature', (req, res) => {
    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
        return res.status(500).json({ message: 'Cloudinary is not configured on the server' });
    }

    const resourceType = req.body.resource_type === 'video' ? 'video' : 'image';
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'kag_maridadi';
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        cloudinaryConfig.api_secret
    );

    res.json({
        cloud_name: cloudinaryConfig.cloud_name,
        api_key: cloudinaryConfig.api_key,
        timestamp,
        folder,
        signature,
        upload_url: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/${resourceType}/upload`
    });
});

// Unified Sermon Upload Handler
const handleSermonUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded' });
    }
    try {
        const newSermon = await Sermon.create({ 
            title: req.body.title, 
            video_url: getUploadedFileUrl(req.file),
            speaker: req.body.speaker || 'KAG Maridadi Church',
            category: req.body.category || 'General',
            description: req.body.description
        });
        res.json({ message: 'Upload success', sermon: newSermon });
    } catch (err) {
        console.error('Sermon upload failed:', err);
        res.status(500).json({ message: 'Upload failed', error: getErrorMessage(err) });
    }
};

// Consolidated sermon upload endpoint
app.post('/api/admin/sermons', uploadSingle('video', {
    allowedMimeTypes: VIDEO_MIME_TYPES,
    maxFileSize: MAX_VIDEO_SIZE
}), handleSermonUpload);

app.post('/api/admin/sermons/direct', async (req, res) => {
    try {
        const { title, speaker, category, video_url, description } = req.body;

        if (!title || !video_url) {
            return res.status(400).json({ message: 'Title and video URL are required' });
        }

        if (!isCloudinarySecureUrl(video_url)) {
            return res.status(400).json({ message: 'Invalid Cloudinary video URL' });
        }

        const newSermon = await Sermon.create({
            title,
            video_url,
            speaker: speaker || 'KAG Maridadi Church',
            category: category || 'General',
            description: description
        });

        res.status(201).json({ message: 'Sermon saved successfully', sermon: newSermon });
    } catch (err) {
        console.error('Direct sermon save failed:', err);
        res.status(500).json({ message: 'Failed to save sermon', error: getErrorMessage(err) });
    }
});

// Delete Sermon Endpoint
app.delete('/api/admin/sermons/:id', async (req, res) => {
    try {
        const sermon = await Sermon.findById(req.params.id);
        if (!sermon) return res.status(404).json({ message: 'Sermon not found' });

        // Delete from Cloudinary if it's a Cloudinary URL
        if (sermon.video_url && sermon.video_url.startsWith('https://res.cloudinary.com')) {
            try {
                const publicId = sermon.video_url.split('/').pop().split('.')[0]; // Extract public ID
                await cloudinary.uploader.destroy(`kag_maridadi/${publicId}`, { resource_type: 'video' });
                console.log(`Deleted Cloudinary video: kag_maridadi/${publicId}`);
            } catch (cloudinaryErr) {
                console.error('Failed to delete Cloudinary video:', cloudinaryErr);
            }
        } else if (sermon.video_url) { // Handle local file cleanup for legacy entries
            const localPath = path.join(uploadDir, path.basename(sermon.video_url));
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }

        await Sermon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sermon deleted successfully' });
    } catch (err) {
        console.error('Sermon delete failed:', err);
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
});

// Announcement Management
app.post('/api/admin/announcements', async (req, res) => {
    try {
        const announcement = await Announcement.create(req.body);
        res.json({ message: 'Announcement posted', announcement });
    } catch (err) { 
        console.error('Failed to post announcement:', err);
        res.status(500).json({ message: 'Failed to post announcement' });
    }
});

app.delete('/api/admin/announcements/:id', async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (err) { 
        console.error('Announcement delete failed:', err);
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Event Management
app.post('/api/admin/events', uploadSingle('image_poster', {
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_IMAGE_SIZE
}), async (req, res) => { // Modified to handle image poster upload
    try {
        const eventData = {
            title: req.body.title,
            event_date: req.body.event_date,
            event_time: req.body.event_time,
            location: req.body.location,
            description: req.body.description,
            is_featured: req.body.is_featured || false // Assuming is_featured can be sent or defaults to false
        };

        if (req.file) {
            eventData.image_poster = getUploadedFileUrl(req.file);
        }
        const event = await Event.create(eventData);
        res.json({ message: 'Event created successfully', event });
    } catch (err) {
        console.error('Failed to create event:', err);
        res.status(500).json({ message: 'Failed to create event', error: getErrorMessage(err) });
    }
});

app.post('/api/admin/events/direct', async (req, res) => {
    try {
        const eventData = {
            title: req.body.title,
            event_date: req.body.event_date,
            event_time: req.body.event_time,
            location: req.body.location,
            description: req.body.description,
            is_featured: req.body.is_featured || false
        };

        if (req.body.image_poster) {
            if (!isCloudinarySecureUrl(req.body.image_poster)) {
                return res.status(400).json({ message: 'Invalid Cloudinary image URL' });
            }

            eventData.image_poster = req.body.image_poster;
        }

        const event = await Event.create(eventData);
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (err) {
        console.error('Failed to create event:', err);
        res.status(500).json({ message: 'Failed to create event', error: getErrorMessage(err) });
    }
});

app.delete('/api/admin/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event && event.image_poster) {
            // Delete from Cloudinary if it's a Cloudinary URL
            if (event.image_poster && event.image_poster.startsWith('https://res.cloudinary.com')) {
                try {
                    const publicId = event.image_poster.split('/').pop().split('.')[0]; // Extract public ID
                    await cloudinary.uploader.destroy(`kag_maridadi/${publicId}`);
                    console.log(`Deleted Cloudinary image: kag_maridadi/${publicId}`);
                } catch (cloudinaryErr) {
                    console.error('Failed to delete Cloudinary image:', cloudinaryErr);
                }
            } else if (event.image_poster) { // Handle local file cleanup for legacy entries
                const localPath = path.join(uploadDir, path.basename(event.image_poster));
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            }
        }
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        console.error('Event delete failed:', err);
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Gallery Management
app.post('/api/admin/gallery', uploadSingle('image', {
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_IMAGE_SIZE
}), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
    }
    try {
        const item = await Gallery.create({
            image_path: getUploadedFileUrl(req.file),
            caption: req.body.caption,
            category: req.body.category || 'General'
        });
        res.json({ message: 'Gallery item added successfully', item });
    } catch (err) {
        console.error('Failed to add gallery item:', err);
        res.status(500).json({ message: 'Failed to add gallery item', error: getErrorMessage(err) });
    }
});

app.post('/api/admin/gallery/direct', async (req, res) => {
    try {
        if (!req.body.image_path) {
            return res.status(400).json({ message: 'No image URL provided' });
        }

        if (!isCloudinarySecureUrl(req.body.image_path)) {
            return res.status(400).json({ message: 'Invalid Cloudinary image URL' });
        }

        const item = await Gallery.create({
            image_path: req.body.image_path,
            caption: req.body.caption,
            category: req.body.category || 'General'
        });

        res.status(201).json({ message: 'Gallery item added successfully', item });
    } catch (err) {
        console.error('Failed to add gallery item:', err);
        res.status(500).json({ message: 'Failed to add gallery item', error: getErrorMessage(err) });
    }
});
 
app.delete('/api/admin/gallery/:id', async (req, res) => {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Gallery item not found' });

        // Delete from Cloudinary if it's a Cloudinary URL
        if (item.image_path && item.image_path.startsWith('https://res.cloudinary.com')) {
            try {
                const publicId = item.image_path.split('/').pop().split('.')[0]; // Extract public ID
                await cloudinary.uploader.destroy(`kag_maridadi/${publicId}`);
                console.log(`Deleted Cloudinary image: kag_maridadi/${publicId}`);
            } catch (cloudinaryErr) {
                console.error('Failed to delete Cloudinary image:', cloudinaryErr);
            }
        } else if (item.image_path) { // Handle local file cleanup for legacy entries
            const localPath = path.join(uploadDir, path.basename(item.image_path));
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }
        await Gallery.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gallery item deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Public Data Endpoints
app.get('/api/sermons', async (req, res) => {
    try {
        const sermons = await Sermon.find().sort({ created_at: -1 });
        res.json(sermons);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/announcements', async (req, res) => {
    try {
        const list = await Announcement.find().sort({ created_at: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ event_date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/blog', async (req, res) => {
    try {
        const posts = await Blog.find().sort({ published_at: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/gallery', async (req, res) => {
    try {
        const category = req.query.category;
        const filter = category && category !== 'All' ? { category } : {};
        const items = await Gallery.find(filter);
        res.json(items);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Prayer Request Endpoints
app.post('/api/prayer-request', async (req, res) => {
    try {
        await Prayer.create({
            member_name: req.body.name,
            phone_number: req.body.phone,
            request_type: req.body.type,
            message: req.body.message
        });
        res.status(201).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save request', error: err.message });
    }
});

// General Contact Message Endpoints
app.post('/api/contact-message', async (req, res) => {
    try {
        await Message.create({
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            content: req.body.message
        });
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send message' });
    }
});

app.get('/api/admin/prayers', async (req, res) => {
    try {
        const prayers = await Prayer.find().sort({ created_at: -1 });
        res.json(prayers);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/admin/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ created_at: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.delete('/api/admin/messages/:id', async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ message: 'Message permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

app.delete('/api/admin/prayers/:id', async (req, res) => {
    try {
        await Prayer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Prayer request permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

app.put('/api/admin/messages/:id', async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.id, { status: 'Read' });
        res.json({ message: 'Message marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

app.put('/api/admin/prayers/:id', async (req, res) => {
    try {
        await Prayer.findByIdAndUpdate(req.params.id, { status: 'Prayed' });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

app.use('/api', (err, req, res, next) => {
    const message = getErrorMessage(err);
    console.error('API error:', err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        message: 'Server error',
        error: message
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});
