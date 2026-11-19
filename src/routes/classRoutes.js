
const express = require('express');
const router = express.Router();

const {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
} = require('../controllers/classController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Admin', 'Teacher'), getClasses);
router.get('/:id', protect, authorize('Admin', 'Teacher'), getClassById);
router.post('/', protect, authorize('Admin'), createClass);
router.put('/:id', protect, authorize('Admin'), updateClass);
router.delete('/:id', protect, authorize('Admin'), deleteClass);

module.exports = router;
