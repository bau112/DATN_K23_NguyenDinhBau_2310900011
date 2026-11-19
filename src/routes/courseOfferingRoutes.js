
const express = require('express');
const router = express.Router();

const courseOfferingController = require('../controllers/courseOfferingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin', 'Teacher'), courseOfferingController.getCourseOfferings);
router.get('/:id', protect, authorize('Admin', 'Teacher'), courseOfferingController.getCourseOfferingById);
router.post('/', protect, authorize('Admin'), courseOfferingController.createCourseOffering);
router.put('/:id', protect, authorize('Admin'), courseOfferingController.updateCourseOffering);
router.delete('/:id', protect, authorize('Admin'), courseOfferingController.deleteCourseOffering);

module.exports = router;
