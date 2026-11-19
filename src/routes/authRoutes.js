
const express = require('express');
const router = express.Router();

const {
    register,
    login,
    getMe
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
router.get('/admin-test', protect, authorize('Admin'), (req, res) => {
    res.json({
        success: true,
        message: 'Ban co quyen Admin'
    });
});

router.get('/teacher-test', protect, authorize('Teacher'), (req, res) => {
    res.json({
        success: true,
        message: 'Ban co quyen Teacher'
    });
});