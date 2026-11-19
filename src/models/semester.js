const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    semesterCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    semesterName: {
        type: String,
        required: true,
        trim: true
    },
    academicYear: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Ongoing', 'Completed'],
        default: 'Upcoming'
    }
}, {
    timestamps: true,
    collection: 'semesters'
});

module.exports = mongoose.model('Semester', semesterSchema);