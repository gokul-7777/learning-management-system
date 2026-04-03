const mongoose = require('mongoose');

// --- 1. Material Schema ---
const MaterialSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true, 
        enum: ['video', 'pdf', 'ppt'] 
    },
    title: { 
        type: String, 
        required: true,
        trim: true 
    },
    url: { 
        type: String, 
        required: true,
        trim: true 
    }
});

// --- 2. Quiz Schema (10 Questions Required) ---
const QuizSchema = new mongoose.Schema({
    question: { 
        type: String, 
        required: true,
        trim: true 
    },
    options: {
        type: [String],
        required: true,
        validate: [v => v.length === 4, 'Each question must have exactly 4 options']
    },
    correctAnswer: { 
        type: String, 
        required: true,
        trim: true 
    }
});

// --- 3. Main Course Schema ---
const CourseSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    materials: {
        type: [MaterialSchema],
        required: true
    },
    // Updated to handle the 10-question assessment plan
    quiz: {
        type: [QuizSchema],
        validate: {
            validator: function(v) {
                return v.length === 10;
            },
            message: 'A course must have exactly 10 assessment questions.'
        }
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Course', CourseSchema);