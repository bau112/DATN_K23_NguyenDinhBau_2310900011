
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    courseOfferingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseOffering',
        required: true
    },
    sessionDate: {
        type: Date,
        required: true
    },
    sessionNumber: {
        type: Number,
        required: true,
        min: 1
    },
    checkInTime: {
        type: Date,
        default: null
    },
    recognitionStatus: {
        type: String,
        enum: ['Recognized', 'NotRecognized', 'Pending'],
        default: 'Pending'
    },
    attendanceStatus: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Excused'],
        default: 'Absent'
    },
    method: {
        type: String,
        enum: ['FaceRecognition', 'Manual'],
        default: 'FaceRecognition'
    }
}, {
    timestamps: true,
    collection: 'attendance'
});

attendanceSchema.index(
    {
        studentId: 1,
        courseOfferingId: 1,
        sessionNumber: 1
    },
    { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
