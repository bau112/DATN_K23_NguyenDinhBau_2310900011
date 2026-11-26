const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get(
    '/my-attendance',
    protect,
    authorize('Student'),
    attendanceController.getMyAttendance
);

router.get(
    '/',
    protect,
    authorize('Admin', 'Teacher'),
    attendanceController.getAttendances
);

router.get(
    '/:id',
    protect,
    authorize('Admin', 'Teacher'),
    attendanceController.getAttendanceById
);

router.post(
    '/',
    protect,
    authorize('Admin', 'Teacher'),
    attendanceController.createAttendance
);

router.put(
    '/:id',
    protect,
    authorize('Admin', 'Teacher'),
    attendanceController.updateAttendance
);

router.delete(
    '/:id',
    protect,
    authorize('Admin'),
    attendanceController.deleteAttendance
);

module.exports = router;