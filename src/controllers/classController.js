
const Class = require('../models/Class');

const getClasses = async (req, res) => {
    try {
        const { keyword, status, page = 1, limit = 10 } = req.query;

        const filter = {};

        if (keyword) {
            filter.$or = [
                { classCode: { $regex: keyword, $options: 'i' } },
                { className: { $regex: keyword, $options: 'i' } },
                { department: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (status) {
            filter.status = status;
        }

        const currentPage = Math.max(1, Number(page));
        const pageSize = Math.min(100, Math.max(1, Number(limit)));

        const total = await Class.countDocuments(filter);

        const classes = await Class.find(filter)
            .populate('advisorId', 'fullName username')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data: classes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getClassById = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id)
            .populate('advisorId', 'fullName username');

        if (!classItem) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay lop hoc'
            });
        }

        res.status(200).json({
            success: true,
            data: classItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const createClass = async (req, res) => {
    try {
        const { classCode, className, department, academicYear, advisorId } = req.body;

        if (!classCode || !className || !department || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'Vui long nhap day du thong tin lop hoc'
            });
        }

        const existingClass = await Class.findOne({ classCode });

        if (existingClass) {
            return res.status(409).json({
                success: false,
                message: 'Ma lop da ton tai'
            });
        }

        const newClass = await Class.create({
            classCode,
            className,
            department,
            academicYear,
            advisorId: advisorId || null,
            status: 'Active'
        });

        res.status(201).json({
            success: true,
            message: 'Them lop hoc thanh cong',
            data: newClass
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateClass = async (req, res) => {
    try {
        const classItem = await Class.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!classItem) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay lop hoc'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cap nhat lop hoc thanh cong',
            data: classItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteClass = async (req, res) => {
    try {
        const classItem = await Class.findByIdAndDelete(req.params.id);

        if (!classItem) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay lop hoc'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xoa lop hoc thanh cong'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};
