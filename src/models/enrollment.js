
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Enrolled', 'Cancelled', 'Completed'],
        default: 'Enrolled'
    }
}, {
    timestamps: true,
    collection: 'enrollments'
});

enrollmentSchema.index(
    { studentId: 1, courseOfferingId: 1 },
    { unique: true }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
