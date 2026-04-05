const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// 1. Load Configurations
dotenv.config();
const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// 2. Models
// Using path.join ensures these work on both Windows and Linux servers
const User = require(path.join(__dirname, 'models/User'));
const Course = require(path.join(__dirname, 'models/Course'));

// 3. Middleware
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json());

// Serving the 'public' folder from the Client directory
// This is the "Brain" connecting your Backend to your Frontend files
app.use(express.static(path.join(__dirname, '../Client/public')));

// --- AUTHENTICATION ROUTES ---

app.post('/api/register', async (req, res) => {
    try {
        const { userid, password } = req.body;
        // The User model automatically handles the empty completedCourses array
        const newUser = new User({ userid, password });
        await newUser.save(); 
        res.status(201).json({ message: "Worker Registered Successfully!" });
    } catch (err) {
        // Log the error for the developer, send a clean message to the user
        console.error("Registration Error:", err.message);
        res.status(400).json({ message: "Registration Failed: ID already exists" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { userid, password } = req.body;
        const user = await User.findOne({ userid, password });
        if (user) {
            res.json({ message: "Login Successful!", user });
        } else {
            res.status(401).json({ message: "Invalid User ID or Password" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- ADMIN ANALYTICS ROUTE ---
// Fetches worker progress for the Admin Dashboard table
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Select only necessary fields; excluding passwords for safety
        const users = await User.find({}, 'userid completedCourses createdAt').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching worker analytics" });
    }
});

// --- PROGRESS TRACKING ROUTE ---
// Called by learning.js when a worker passes their assessment
app.post('/api/users/complete', async (req, res) => {
    try {
        const { userid, courseTitle } = req.body;
        
        // $addToSet prevents the same course being added twice if they retake the quiz
        const updatedUser = await User.findOneAndUpdate(
            { userid: userid },
            { $addToSet: { completedCourses: courseTitle } },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Certification saved to database!" });
    } catch (err) {
        res.status(500).json({ message: "Error saving progress" });
    }
});

// --- COURSE MANAGEMENT ROUTES ---

app.post('/api/courses', async (req, res) => {
    try {
        const { title, materials, quiz } = req.body;

        if (!title || !materials || materials.length === 0) {
            return res.status(400).json({ message: "Title and materials are required." });
        }

        if (!quiz || quiz.length < 10) {
            return res.status(400).json({ message: "Exactly 10 quiz questions are required." });
        }

        const newCourse = new Course({ title, materials, quiz });
        await newCourse.save();
        res.status(201).json({ message: "SkillForge Module Deployed!" });
    } catch (err) {
        res.status(400).json({ message: "Database Error: Course title must be unique." });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: "Could not fetch modules" });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: "Module not found" });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: "Invalid Module ID" });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: "Module removed!" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting module" });
    }
});

// --- STARTUP LOGIC ---
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// Set strictQuery to suppress Mongoose 7 warnings
mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ Connection: SkillForge is connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`\n🚀 SkillForge Server Active!`);
            console.log(`🔗 Admin Portal:  http://localhost:${PORT}/admin.html`);
            console.log(`🔗 Worker Portal: http://localhost:${PORT}/index.html`);
        });
    })
    .catch(err => console.error("❌ Connection Error:", err.message));
