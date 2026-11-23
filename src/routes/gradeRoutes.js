
const express = require('express');
const router = express.Router();

const gradeController = require('../controllers/gradeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-results', protect, authorize('Student'), gradeController.getMyGrades);

router.get('/', protect, authorize('Admin', 'Teacher'), gradeController.getGrades);

router.get('/:id', protect, authorize('Admin', 'Teacher'), gradeController.getGradeById);

router.post('/', protect, authorize('Admin', 'Teacher'), gradeController.createGrade);

router.put('/:id', protect, authorize('Admin', 'Teacher'), gradeController.updateGrade);

router.delete('/:id', protect, authorize('Admin'), gradeController.deleteGrade);

module.exports = router;
