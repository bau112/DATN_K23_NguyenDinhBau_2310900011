
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        if (!username || !email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Vui long nhap day du thong tin'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Mat khau phai co it nhat 8 ky tu'
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: email.trim().toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Ten dang nhap hoac email da ton tai'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            fullName: fullName.trim(),
            role: 'Student',
            status: 'Active'
        });

        return res.status(201).json({
            success: true,
            message: 'Dang ky tai khoan thanh cong',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Loi dang ky tai khoan',
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui long nhap ten dang nhap va mat khau'
            });
        }

        const user = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: username.trim().toLowerCase() }
            ]
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Ten dang nhap hoac mat khau khong chinh xac'
            });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Tai khoan khong hoat dong'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Ten dang nhap hoac mat khau khong chinh xac'
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Dang nhap thanh cong',
            token,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Loi dang nhap',
            error: error.message
        });
    }
};

const getMe = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Lay thong tin tai khoan thanh cong',
            data: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                fullName: req.user.fullName,
                role: req.user.role,
                studentId: req.user.studentId,
                status: req.user.status
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Loi lay thong tin tai khoan'
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};
