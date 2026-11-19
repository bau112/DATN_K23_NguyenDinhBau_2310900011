
const mongoose = require('mongoose');

const faceProfileSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        unique: true
    },
    imagePath: {
        type: String,
        required: true,
        trim: true
    },
    faceEmbedding: {
        type: [Number],
        default: []
    },
    modelVersion: {
        type: String,
        default: 'face-api-v1'
    },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Inactive'],
        default: 'Pending'
    }
}, {
    timestamps: true,
    collection: 'faceProfiles'
});

module.exports = mongoose.model('FaceProfile', faceProfileSchema);
