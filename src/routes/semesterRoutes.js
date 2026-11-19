
const express = require('express');
const router = express.Router();

const semesterController = require('../controllers/semesterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin', 'Teacher'), semesterController.getSemesters);
router.get('/:id', protect, authorize('Admin', 'Teacher'), semesterController.getSemesterById);
router.post('/', protect, authorize('Admin'), semesterController.createSemester);
router.put('/:id', protect, authorize('Admin'), semesterController.updateSemester);
router.delete('/:id', protect, authorize('Admin'), semesterController.deleteSemester);

module.exports = router;
