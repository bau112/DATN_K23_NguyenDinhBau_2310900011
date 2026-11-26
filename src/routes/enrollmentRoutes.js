
const express = require('express');
const router = express.Router();

const enrollmentController = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-enrollments', protect, authorize('Student'), enrollmentController.getMyEnrollments);

router.get('/', protect, authorize('Admin', 'Teacher'), enrollmentController.getEnrollments);
router.get('/:id', protect, authorize('Admin', 'Teacher'), enrollmentController.getEnrollmentById);
router.post('/', protect, authorize('Admin'), enrollmentController.createEnrollment);
router.put('/:id', protect, authorize('Admin'), enrollmentController.updateEnrollment);
router.delete('/:id', protect, authorize('Admin'), enrollmentController.deleteEnrollment);

module.exports = router;
