
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    classCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    className: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    advisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true,
    collection: 'classes'
});

module.exports = mongoose.model('Class', classSchema);
