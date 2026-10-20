const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors()); // Allows Admin and Frontend to talk to this server
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Allows handling of standard form submissions

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kag_maridadi';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const sermonRegistryDir = path.join(__dirname, 'data');
const sermonRegistryPath = path.join(sermonRegistryDir, 'sermons.json');
if (!fs.existsSync(sermonRegistryDir)) fs.mkdirSync(sermonRegistryDir, { recursive: true });
if (!fs.existsSync(sermonRegistryPath)) fs.writeFileSync(sermonRegistryPath, JSON.stringify({ sermons: [], deletedIds: [] }, null, 2));

app.use('/uploads', express.static(uploadDir));

function resolveSermonFile(videoUrl) {
    if (typeof videoUrl !== 'string' || !videoUrl.trim()) return null;

    let storedPath = videoUrl.trim();
    try {
        if (/^https?:\/\//i.test(storedPath)) storedPath = new URL(storedPath).pathname;
    } catch {
        return null;
    }

    storedPath = storedPath.split(/[?#]/, 1)[0].replace(/\\/g, '/');
    try {
        storedPath = decodeURIComponent(storedPath);
    } catch {
        return null;
    }

    const fileName = path.posix.basename(storedPath);
    if (!fileName || fileName === '.' || fileName === '..') return null;
    const fullPath = path.join(uploadDir, fileName);
    return { fileName, fullPath, url: `/uploads/${encodeURIComponent(fileName)}` };
}

function isImageFile(file) {
    return Boolean(file && file.mimetype && file.mimetype.startsWith('image/'));
}

function isImagePath(filePath) {
    return typeof filePath === 'string' && /\.(?:jpe?g|png|webp|gif)(?:[?#].*)?$/i.test(filePath);
}

function sermonMediaFile(sermon) {
    const imagePath = sermon && (sermon.image_url || (isImagePath(sermon.video_url) ? sermon.video_url : ''));
    const videoPath = sermon && sermon.video_url;
    return resolveSermonFile(imagePath || videoPath);
}

// Serve Frontend and Admin static files for "Live" deployment
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use('/admin-panel', express.static(path.join(__dirname, '../Admin')));

// Database Schemas & Models
const Sermon = mongoose.model('Sermon', new mongoose.Schema({
    title: { type: String, required: true },
    video_url: { type: String, default: '' },
    image_url: { type: String, default: '' },
    poster_url: { type: String, default: '' },
    media_type: { type: String, enum: ['video', 'image'], default: 'video' },
    speaker: String,
    category: String,
    created_at: { type: Date, default: Date.now }
}));

async function purgeDeletedSermonsFromDatabase() {
    const registry = readSermonRegistry();
    const deletedIds = registry.deletedIds.filter(id => mongoose.isValidObjectId(id));
    if (!deletedIds.length) return;

    await Sermon.deleteMany({ _id: { $in: deletedIds } });
    registry.deletedIds = registry.deletedIds.filter(id => !deletedIds.includes(id));
    writeSermonRegistry(registry);
}

mongoose.connection.on('connected', () => {
    purgeDeletedSermonsFromDatabase().catch(error => {
        console.error('Could not finish removing deleted sermons from MongoDB:', error.message);
    });
});

function readSermonRegistry() {
    try {
        const data = JSON.parse(fs.readFileSync(sermonRegistryPath, 'utf8'));
        if (Array.isArray(data)) return { sermons: data, deletedIds: [] };
        return {
            sermons: Array.isArray(data.sermons) ? data.sermons : [],
            deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds.map(String) : []
        };
    } catch (err) {
        console.error('Could not read the sermon registry:', err.message);
        return { sermons: [], deletedIds: [] };
    }
}

function writeSermonRegistry(registry) {
    const tempPath = `${sermonRegistryPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(registry, null, 2));
    fs.renameSync(tempPath, sermonRegistryPath);
}

async function getSermonById(id) {
    const registry = readSermonRegistry();
    if (registry.deletedIds.includes(String(id))) return null;
    const saved = registry.sermons.find(sermon => String(sermon._id) === String(id));
    if (saved) return saved;
    if (mongoose.connection.readyState === 1) return Sermon.findById(id);
    return null;
}

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

// Authentication Endpoints
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // First check database for registered users
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            return res.json({ token: 'SECRET_CHURCH_KEY_777', role: 'Admin' });
        }

        // Fallback for hardcoded admin during initial migration
        if (username === 'admin' && password === 'admin@1234') {
            return res.json({ token: 'SECRET_CHURCH_KEY_777', role: 'Admin' });
        }

        res.status(401).json({ message: 'Invalid username or password' });
    } catch (err) {
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
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = new Set(['video/mp4', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']);
        if (allowed.has(file.mimetype)) return cb(null, true);
        cb(new Error('Upload an MP4 video or a JPG, PNG, WEBP, or GIF image.'));
    }
});

function uploadSermonFiles() {
    const parseFile = upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'poster', maxCount: 1 },
        { name: 'sermonFile', maxCount: 1 },
        { name: 'posterFile', maxCount: 1 }
    ]);
    return (req, res, next) => parseFile(req, res, error => {
        if (!error) return next();
        return res.status(400).json({ message: error.message || 'The selected media could not be uploaded.' });
    });
}

// Unified Sermon Upload Handler
const handleSermonUpload = async (req, res) => {
    const mediaFile = req.files?.video?.[0] || req.files?.sermonFile?.[0];
    const posterFile = req.files?.poster?.[0] || req.files?.posterFile?.[0];
    if (!mediaFile) {
        if (posterFile && fs.existsSync(posterFile.path)) fs.unlinkSync(posterFile.path);
        return res.status(400).json({ message: 'Choose an MP4 video or an image to upload.' });
    }
    const isImage = isImageFile(mediaFile);
    if ((!isImage && !posterFile) || (posterFile && (isImage || !isImageFile(posterFile)))) {
        for (const file of [mediaFile, posterFile]) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
        return res.status(400).json({ message: isImage ? 'A thumbnail can only be added to a video.' : 'Please add a thumbnail image for this sermon video.' });
    }
    try {
        const mediaUrl = `/uploads/${encodeURIComponent(mediaFile.filename)}`;
        const newSermon = {
            _id: new mongoose.Types.ObjectId().toString(),
            title: req.body.title,
            video_url: isImage ? '' : mediaUrl,
            image_url: isImage ? mediaUrl : '',
            poster_url: posterFile ? `/uploads/${encodeURIComponent(posterFile.filename)}` : '',
            media_type: isImage ? 'image' : 'video',
            speaker: req.body.speaker || 'KAG Maridadi',
            category: req.body.category || 'General',
            created_at: new Date()
        };

        const registry = readSermonRegistry();
        registry.deletedIds = registry.deletedIds.filter(id => id !== newSermon._id);
        registry.sermons.unshift(newSermon);
        writeSermonRegistry(registry);

        if (mongoose.connection.readyState === 1) {
            try {
                await Sermon.create(newSermon);
            } catch (dbError) {
                console.error('Sermon saved locally; MongoDB sync failed:', dbError.message);
            }
        }
        return res.status(201).json({ message: 'Upload success', sermon: newSermon });
    } catch (err) {
        for (const file of [mediaFile, posterFile]) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
        return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
};

app.post('/api/admin/upload', uploadSermonFiles(), handleSermonUpload);
app.post('/api/admin/sermons', uploadSermonFiles(), handleSermonUpload);

// Delete Sermon Endpoint
app.delete('/api/admin/sermons/:id', async (req, res) => {
    try {
        const sermon = await getSermonById(req.params.id);
        if (!sermon) return res.status(404).json({ message: 'Sermon not found' });

        // Permanently remove every uploaded asset attached to the sermon.
        const mediaFiles = [sermon.video_url, sermon.image_url, sermon.poster_url]
            .map(resolveSermonFile)
            .filter(Boolean);
        const removedPaths = new Set();
        for (const mediaFile of mediaFiles) {
            if (removedPaths.has(mediaFile.fullPath)) continue;
            removedPaths.add(mediaFile.fullPath);
            if (fs.existsSync(mediaFile.fullPath)) fs.unlinkSync(mediaFile.fullPath);
        }

        const registry = readSermonRegistry();
        registry.sermons = registry.sermons.filter(saved => String(saved._id) !== String(req.params.id));
        if (!registry.deletedIds.includes(String(req.params.id))) registry.deletedIds.push(String(req.params.id));
        writeSermonRegistry(registry);
        if (mongoose.connection.readyState === 1) {
            await Sermon.findByIdAndDelete(req.params.id);
            const latestRegistry = readSermonRegistry();
            latestRegistry.deletedIds = latestRegistry.deletedIds.filter(id => id !== String(req.params.id));
            writeSermonRegistry(latestRegistry);
        }
        res.json({ message: 'Sermon deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
});

// Announcement Management
app.post('/api/admin/announcements', async (req, res) => {
    try {
        const announcement = await Announcement.create(req.body);
        res.json({ message: 'Announcement posted', announcement });
    } catch (err) {
        res.status(500).json({ message: 'Failed to post announcement' });
    }
});

app.delete('/api/admin/announcements/:id', async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Public Data Endpoints
app.get('/api/sermons', async (req, res) => {
    try {
        const registry = readSermonRegistry();
        const knownIds = new Set(registry.sermons.map(sermon => String(sermon._id)));
        if (mongoose.connection.readyState === 1) {
            try {
                const databaseSermons = await Sermon.find().sort({ created_at: -1 }).lean();
                for (const sermon of databaseSermons) {
                    const id = String(sermon._id);
                    if (!knownIds.has(id) && !registry.deletedIds.includes(id)) {
                        registry.sermons.push({ ...sermon, _id: id });
                        knownIds.add(id);
                    }
                }
            } catch (dbError) {
                console.error('Loading sermons from local storage; MongoDB read failed:', dbError.message);
            }
        }

        const latestRegistry = readSermonRegistry();
        const deletedIds = new Set([...registry.deletedIds, ...latestRegistry.deletedIds]);
        const mergedById = new Map(latestRegistry.sermons.map(sermon => [String(sermon._id), sermon]));
        for (const sermon of registry.sermons) {
            const id = String(sermon._id);
            if (!deletedIds.has(id) && !mergedById.has(id)) mergedById.set(id, sermon);
        }
        registry.sermons = [...mergedById.values()];
        registry.deletedIds = [...deletedIds];

        // Recover video uploads that exist on disk but lost their database entry.
        const registeredFiles = new Set(registry.sermons
            .map(sermon => sermonMediaFile(sermon)?.fileName)
            .filter(Boolean));
        const videoExtensions = new Set(['.mp4', '.m4v', '.mov', '.webm', '.ogv']);
        for (const fileName of fs.readdirSync(uploadDir)) {
            if (registeredFiles.has(fileName) || !videoExtensions.has(path.extname(fileName).toLowerCase())) continue;
            const stats = fs.statSync(path.join(uploadDir, fileName));
            if (!stats.isFile()) continue;
            const title = path.parse(fileName).name.replace(/^\d+-/, '').replace(/[_-]+/g, ' ').trim();
            const recovered = {
                _id: new mongoose.Types.ObjectId().toString(),
                title: title || 'Recovered Sermon',
                speaker: 'KAG Maridadi',
                category: 'General',
                video_url: `/uploads/${encodeURIComponent(fileName)}`,
                created_at: stats.mtime
            };
            registry.sermons.push(recovered);
            registeredFiles.add(fileName);
        }
        writeSermonRegistry(registry);

        const sermons = registry.sermons
            .filter(sermon => !registry.deletedIds.includes(String(sermon._id)))
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        res.json(sermons.map(sermon => {
            const record = typeof sermon.toObject === 'function' ? sermon.toObject() : sermon;
            const imageRecord = record.media_type === 'image' || record.image_url || isImagePath(record.video_url);
            const mediaFile = sermonMediaFile(record);
            const posterFile = resolveSermonFile(record.poster_url);
            const mediaAvailable = Boolean(mediaFile && fs.existsSync(mediaFile.fullPath));
            return {
                ...record,
                media_type: imageRecord ? 'image' : 'video',
                video_url: !imageRecord && mediaFile ? mediaFile.url : '',
                image_url: imageRecord && mediaFile ? mediaFile.url : '',
                poster_url: posterFile && fs.existsSync(posterFile.fullPath) ? posterFile.url : '',
                poster_available: Boolean(posterFile && fs.existsSync(posterFile.fullPath)),
                video_available: mediaAvailable && !imageRecord,
                image_available: mediaAvailable && Boolean(imageRecord),
                media_available: mediaAvailable
            };
        }));
    } catch (err) {
        console.error('Could not load sermons:', err.message);
        res.status(500).json({ message: 'Sermon storage could not be read.' });
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

app.get('/api/sermons/:id/video', async (req, res) => {
    try {
        const sermon = await getSermonById(req.params.id);
        const isImage = sermon && (sermon.media_type === 'image' || sermon.image_url || isImagePath(sermon.video_url));
        const videoFile = sermon && !isImage && resolveSermonFile(sermon.video_url);
        if (!videoFile || !fs.existsSync(videoFile.fullPath)) {
            return res.status(404).json({ message: 'Sermon video not found' });
        }
        return res.sendFile(videoFile.fullPath);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid sermon reference' });
    }
});

app.get('/api/sermons/:id/download', async (req, res) => {
    try {
        const sermon = await getSermonById(req.params.id);
        const videoFile = sermon && sermonMediaFile(sermon);
        if (!videoFile || !fs.existsSync(videoFile.fullPath)) {
            return res.status(404).json({ message: 'Sermon file not found' });
        }
        return res.download(videoFile.fullPath, videoFile.fileName);
    } catch (err) {
        return res.status(400).json({ message: 'Invalid sermon reference' });
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err.message);
});
