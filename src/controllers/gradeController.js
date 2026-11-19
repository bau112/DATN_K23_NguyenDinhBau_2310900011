
const mongoose = require('mongoose');

const Grade = require('../models/Grade');
const Student = require('../models/Student');
const CourseOffering = require('../models/CourseOffering');
const Enrollment = require('../models/Enrollment');

const calculateGrade = (components) => {
    const totalWeight = components.reduce((sum, item) => sum + item.weight, 0);

    if (Math.abs(totalWeight - 100) > 0.01) {
        throw new Error('Tong trong so cac thanh phan phai bang 100%');
    }

    const totalScore = Number(
        components.reduce((sum, item) => {
            return sum + item.score * item.weight / 100;
        }, 0).toFixed(1)
    );

    let letterGrade;
    let result;

    if (totalScore >= 8.5) {
        letterGrade = 'A';
        result = 'Passed';
    } else if (totalScore >= 7) {
        letterGrade = 'B';
        result = 'Passed';
    } else if (totalScore >= 5.5) {
        letterGrade = 'C';
        result = 'Passed';
    } else if (totalScore >= 4) {
        letterGrade = 'D';
        result = 'Passed';
    } else {
        letterGrade = 'F';
        result = 'Failed';
    }

    return { totalScore, letterGrade, result };
};

const validateReferences = async (studentId, courseOfferingId) => {
    if (!mongoose.Types.ObjectId.isValid(studentId) ||
        !mongoose.Types.ObjectId.isValid(courseOfferingId)) {
        throw new Error('Ma sinh vien hoac ma hoc phan khong hop le');
    }

    const student = await Student.findById(studentId);
    if (!student) {
        throw new Error('Khong tim thay sinh vien');
    }

    const courseOffering = await CourseOffering.findById(courseOfferingId);
    if (!courseOffering) {
        throw new Error('Khong tim thay hoc phan');
    }

    const enrollment = await Enrollment.findOne({
        studentId,
        courseOfferingId,
        status: { $in: ['Enrolled', 'Completed'] }
    });

    if (!enrollment) {
        throw new Error('Sinh vien chua dang ky hoc phan nay');
    }
};

const getGrades = async (req, res) => {
    try {
        const {
            studentId,
            courseOfferingId,
            result,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (studentId) filter.studentId = studentId;
        if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
        if (result) filter.result = result;

        const currentPage = Math.max(1, Number(page));
        const pageSize = Math.min(100, Math.max(1, Number(limit)));

        const [grades, total] = await Promise.all([
            Grade.find(filter)
                .populate('studentId', 'studentCode fullName')
                .populate({
                    path: 'courseOfferingId',
                    populate: [
                        { path: 'subjectId', select: 'subjectCode subjectName credits' },
                        { path: 'semesterId', select: 'semesterCode semesterName academicYear' },
                        { path: 'classId', select: 'classCode className' },
                        { path: 'teacherId', select: 'fullName username' }
                    ]
                })
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * pageSize)
                .limit(pageSize),
            Grade.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data: grades
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getGradeById = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id)
            .populate('studentId', 'studentCode fullName')
            .populate({
                path: 'courseOfferingId',
                populate: [
                    { path: 'subjectId', select: 'subjectCode subjectName credits' },
                    { path: 'semesterId', select: 'semesterCode semesterName academicYear' },
                    { path: 'classId', select: 'classCode className' },
                    { path: 'teacherId', select: 'fullName username' }
                ]
            });

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay diem'
            });
        }

        res.status(200).json({
            success: true,
            data: grade
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const createGrade = async (req, res) => {
    try {
        const { studentId, courseOfferingId, components } = req.body;

        if (!studentId || !courseOfferingId || !Array.isArray(components) || components.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui long cung cap sinh vien, hoc phan va cac thanh phan diem'
            });
        }

        for (const item of components) {
            if (
                !item.name ||
                !Number.isFinite(Number(item.score)) ||
                !Number.isFinite(Number(item.weight)) ||
                Number(item.score) < 0 ||
                Number(item.score) > 10 ||
                Number(item.weight) <= 0 ||
                Number(item.weight) > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Thanh phan diem khong hop le'
                });
            }
        }

        await validateReferences(studentId, courseOfferingId);

        const existingGrade = await Grade.findOne({
            studentId,
            courseOfferingId
        });

        if (existingGrade) {
            return res.status(409).json({
                success: false,
                message: 'Sinh vien da co diem trong hoc phan nay'
            });
        }

        const calculated = calculateGrade(components);

        const grade = await Grade.create({
            studentId,
            courseOfferingId,
            components,
            ...calculated
        });

        const populatedGrade = await Grade.findById(grade._id)
            .populate('studentId', 'studentCode fullName')
            .populate('courseOfferingId');

        res.status(201).json({
            success: true,
            message: 'Them diem thanh cong',
            data: populatedGrade
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay diem'
            });
        }

        const allowedFields = ['studentId', 'courseOfferingId', 'components'];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                grade[field] = req.body[field];
            }
        }

        if (!Array.isArray(grade.components) || grade.components.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sach thanh phan diem khong hop le'
            });
        }

        for (const item of grade.components) {
            if (
                !item.name ||
                !Number.isFinite(Number(item.score)) ||
                !Number.isFinite(Number(item.weight)) ||
                item.score < 0 ||
                item.score > 10 ||
                item.weight <= 0 ||
                item.weight > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Thanh phan diem khong hop le'
                });
            }
        }

        await validateReferences(grade.studentId, grade.courseOfferingId);

        const duplicate = await Grade.findOne({
            _id: { $ne: grade._id },
            studentId: grade.studentId,
            courseOfferingId: grade.courseOfferingId
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: 'Sinh vien da co diem trong hoc phan nay'
            });
        }

        const calculated = calculateGrade(grade.components);

        grade.totalScore = calculated.totalScore;
        grade.letterGrade = calculated.letterGrade;
        grade.result = calculated.result;

        await grade.save();

        const populatedGrade = await Grade.findById(grade._id)
            .populate('studentId', 'studentCode fullName')
            .populate('courseOfferingId');

        res.status(200).json({
            success: true,
            message: 'Cap nhat diem thanh cong',
            data: populatedGrade
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findByIdAndDelete(req.params.id);

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay diem'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xoa diem thanh cong'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getGrades,
    getGradeById,
    createGrade,
    updateGrade,
    deleteGrade
};
