require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/User');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the correct directory
app.use(express.static(path.join(__dirname, 'my-website/src')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure required directories exist
fs.ensureDirSync(path.join(__dirname, 'uploads'));
fs.ensureDirSync(path.join(__dirname, 'my-website/src'));

// Debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const title = req.body.title;
        const folderName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const uploadPath = path.join(__dirname, 'uploads', folderName);
        await fs.ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, 'video.mp4');
        } else if (file.fieldname === 'logo') {
            cb(null, 'logo.png');
        }
    }
});

const upload = multer({ storage: storage });

// Route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-website/src/index.html'));
});

// Route for the upload page
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'my-website/src/upload.html'));
});

// Handle file uploads
app.post('/upload', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, channelName } = req.body;
        const folderName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const uploadPath = path.join(__dirname, 'uploads', folderName);

        // Create info.txt
        await fs.writeFile(
            path.join(uploadPath, 'info.txt'),
            `Title: ${title}\nChannel: ${channelName}`
        );

        // Update videos list
        const videosListPath = path.join(__dirname, 'uploads', 'videos.json');
        let videosList = [];
        
        try {
            videosList = JSON.parse(await fs.readFile(videosListPath));
        } catch (error) {
            // If file doesn't exist, start with empty array
        }

        videosList.push({
            id: folderName,
            title,
            channelName,
            path: `${folderName}/video.mp4`,
            logo: `${folderName}/logo.png`
        });

        await fs.writeFile(videosListPath, JSON.stringify(videosList, null, 2));

        res.json({ success: true, message: 'Upload complete' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// Get list of videos
app.get('/videos', async (req, res) => {
    try {
        const videosListPath = path.join(__dirname, 'uploads', 'videos.json');
        const videosList = await fs.readJson(videosListPath);
        res.json(videosList);
    } catch (error) {
        console.error('Error reading videos list:', error);
        res.json([]);
    }
});

// Authentication routes
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.username === username ? 
                    'Username already taken' : 'Email already registered'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            verificationToken: uuidv4(),
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await user.save();

        res.json({
            success: true,
            message: 'Registration successful! Please check your email for verification.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = Array.from(users.values()).find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Check if user is verified
        if (!user.verified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Login successful
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

app.get('/auth/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find user by verification token
        const user = Array.from(users.values()).find(u => u.verificationToken === token);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        // Mark user as verified
        user.verified = true;
        user.verificationToken = null;

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Serving static files from: ${path.join(__dirname, 'my-website/src')}`);
    console.log(`Serving uploads from: ${path.join(__dirname, 'uploads')}`);
});