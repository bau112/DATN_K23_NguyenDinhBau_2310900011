
const Subject = require('../models/Subject');
const CourseOffering = require('../models/CourseOffering');

const getSubjects = async (req, res) => {
    try {
        const { keyword, status, page = 1, limit = 10 } = req.query;

        const filter = {};

        if (keyword) {
            filter.$or = [
                { subjectCode: { $regex: keyword, $options: 'i' } },
                { subjectName: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (status) {
            filter.status = status;
        }

        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

        const total = await Subject.countDocuments(filter);

        const subjects = await Subject.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data: subjects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay mon hoc'
            });
        }

        res.status(200).json({
            success: true,
            data: subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const createSubject = async (req, res) => {
    try {
        const { subjectCode, subjectName, credits, description } = req.body;

        if (!subjectCode || !subjectName || credits === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui long nhap day du thong tin mon hoc'
            });
        }

        const existingSubject = await Subject.findOne({
            subjectCode: subjectCode.trim().toUpperCase()
        });

        if (existingSubject) {
            return res.status(409).json({
                success: false,
                message: 'Ma mon hoc da ton tai'
            });
        }

        const newSubject = await Subject.create({
            subjectCode,
            subjectName,
            credits,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Them mon hoc thanh cong',
            data: newSubject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay mon hoc'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cap nhat mon hoc thanh cong',
            data: subject
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay mon hoc'
            });
        }

        const usedSubject = await CourseOffering.exists({
            subjectId: subject._id
        });

        if (usedSubject) {
            return res.status(400).json({
                success: false,
                message: 'Khong the xoa mon hoc dang duoc su dung trong hoc phan'
            });
        }

        await subject.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Xoa mon hoc thanh cong'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};
