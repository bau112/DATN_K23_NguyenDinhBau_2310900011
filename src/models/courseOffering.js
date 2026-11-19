
const mongoose = require('mongoose');

const courseOfferingSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    semesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    schedule: [{
        dayOfWeek: {
            type: Number,
            min: 2,
            max: 8
        },
        startPeriod: {
            type: Number,
            min: 1
        },
        endPeriod: {
            type: Number,
            min: 1
        },
        room: {
            type: String,
            trim: true
        }
    }],
    maxStudents: {
        type: Number,
        default: 50,
        min: 1
    },
    status: {
        type: String,
        enum: ['Open', 'Closed', 'Completed'],
        default: 'Open'
    }
}, {
    timestamps: true,
    collection: 'courseOfferings'
});

module.exports = mongoose.model('CourseOffering', courseOfferingSchema);
