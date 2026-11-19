
const express = require('express');
const router = express.Router();

const {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} = require('../controllers/subjectController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin', 'Teacher'), getSubjects);

router.get('/:id', protect, authorize('Admin', 'Teacher'), getSubjectById);

router.post('/', protect, authorize('Admin'), createSubject);

router.put('/:id', protect, authorize('Admin'), updateSubject);

router.delete('/:id', protect, authorize('Admin'), deleteSubject);

module.exports = router;
