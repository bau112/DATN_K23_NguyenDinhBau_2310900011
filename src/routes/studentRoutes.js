
const express = require('express');
const router = express.Router();

const {
    getStudents,
    getStudentById,
    getMyStudentProfile,
    createStudent,
    updateStudent,
    deleteStudent
} = require('../controllers/studentController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, authorize('Student'), getMyStudentProfile);

router.get('/', protect, authorize('Admin', 'Teacher'), getStudents);

router.get('/:id', protect, authorize('Admin', 'Teacher'), getStudentById);

router.post('/', protect, authorize('Admin'), createStudent);

router.put('/:id', protect, authorize('Admin'), updateStudent);

router.delete('/:id', protect, authorize('Admin'), deleteStudent);

module.exports = router;
