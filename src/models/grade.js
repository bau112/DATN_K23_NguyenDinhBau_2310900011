
const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
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
    components: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        weight: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        }
    }],
    totalScore: {
        type: Number,
        min: 0,
        max: 10,
        default: null
    },
    letterGrade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'F', null],
        default: null
    },
    result: {
        type: String,
        enum: ['Passed', 'Failed', 'Pending'],
        default: 'Pending'
    }
}, {
    timestamps: true,
    collection: 'grades'
});

gradeSchema.index(
    { studentId: 1, courseOfferingId: 1 },
    { unique: true }
);

module.exports = mongoose.model('Grade', gradeSchema);
