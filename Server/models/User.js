const mongoose = require('mongoose');

// The User Schema defines how a worker's data is stored in MongoDB
const UserSchema = new mongoose.Schema({
    userid: { 
        type: String, 
        required: true, 
        unique: true   // Prevents duplicate IDs in the system
    },
    password: { 
        type: String, 
        required: true 
    },
    // NEW: This array tracks the titles of modules the user has passed
    completedCourses: {
        type: [String], 
        default: []    // Starts empty for a new user
    },
    // OPTIONAL: Track when the user joined
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Export the model so server.js can use it to find/update users
module.exports = mongoose.model('User', UserSchema);