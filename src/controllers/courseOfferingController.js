
const CourseOffering = require('../models/CourseOffering');
const Subject = require('../models/Subject');
const Semester = require('../models/Semester');
const Class = require('../models/Class');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

const getCourseOfferings = async (req, res) => {
    try {
        const { keyword, semesterId, classId, teacherId, status, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (keyword) {
            filter.courseCode = { $regex: keyword, $options: 'i' };
        }

        if (semesterId) filter.semesterId = semesterId;
        if (classId) filter.classId = classId;
        if (teacherId) filter.teacherId = teacherId;
        if (status) filter.status = status;

        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

        const total = await CourseOffering.countDocuments(filter);

        const courseOfferings = await CourseOffering.find(filter)
            .populate('subjectId', 'subjectCode subjectName credits')
            .populate('semesterId', 'semesterCode semesterName academicYear')
            .populate('classId', 'classCode className')
            .populate('teacherId', 'username fullName email')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data: courseOfferings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getCourseOfferingById = async (req, res) => {
    try {
        const courseOffering = await CourseOffering.findById(req.params.id)
            .populate('subjectId', 'subjectCode subjectName credits')
            .populate('semesterId', 'semesterCode semesterName academicYear')
            .populate('classId', 'classCode className')
            .populate('teacherId', 'username fullName email');

        if (!courseOffering) {
            return res.status(404).json({ success: false, message: 'Khong tim thay hoc phan' });
        }

        res.status(200).json({ success: true, data: courseOffering });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createCourseOffering = async (req, res) => {
    try {
        const {
            courseCode,
            subjectId,
            semesterId,
            classId,
            teacherId,
            schedule,
            maxStudents
        } = req.body;

        if (!courseCode || !subjectId || !semesterId || !classId || !teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Vui long nhap day du thong tin hoc phan'
            });
        }

        const [subject, semester, classData, teacher] = await Promise.all([
            Subject.findById(subjectId),
            Semester.findById(semesterId),
            Class.findById(classId),
            User.findOne({ _id: teacherId, role: 'Teacher', status: 'Active' })
        ]);

        if (!subject) {
            return res.status(404).json({ success: false, message: 'Mon hoc khong ton tai' });
        }

        if (!semester) {
            return res.status(404).json({ success: false, message: 'Hoc ky khong ton tai' });
        }

        if (!classData) {
            return res.status(404).json({ success: false, message: 'Lop hoc khong ton tai' });
        }

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Giang vien khong ton tai hoac khong hoat dong' });
        }

        const existingCourse = await CourseOffering.findOne({
            courseCode: courseCode.trim().toUpperCase()
        });

        if (existingCourse) {
            return res.status(409).json({ success: false, message: 'Ma hoc phan da ton tai' });
        }

        const courseOffering = await CourseOffering.create({
            courseCode,
            subjectId,
            semesterId,
            classId,
            teacherId,
            schedule: schedule || [],
            maxStudents: maxStudents || 50
        });

        const populatedCourse = await CourseOffering.findById(courseOffering._id)
            .populate('subjectId', 'subjectCode subjectName credits')
            .populate('semesterId', 'semesterCode semesterName academicYear')
            .populate('classId', 'classCode className')
            .populate('teacherId', 'username fullName email');

        res.status(201).json({
            success: true,
            message: 'Them hoc phan thanh cong',
            data: populatedCourse
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCourseOffering = async (req, res) => {
    try {
        const courseOffering = await CourseOffering.findById(req.params.id);

        if (!courseOffering) {
            return res.status(404).json({ success: false, message: 'Khong tim thay hoc phan' });
        }

        const allowedFields = [
            'courseCode',
            'subjectId',
            'semesterId',
            'classId',
            'teacherId',
            'schedule',
            'maxStudents',
            'status'
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                courseOffering[field] = req.body[field];
            }
        }

        await courseOffering.save();

        const updatedCourse = await CourseOffering.findById(courseOffering._id)
            .populate('subjectId', 'subjectCode subjectName credits')
            .populate('semesterId', 'semesterCode semesterName academicYear')
            .populate('classId', 'classCode className')
            .populate('teacherId', 'username fullName email');

        res.status(200).json({
            success: true,
            message: 'Cap nhat hoc phan thanh cong',
            data: updatedCourse
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCourseOffering = async (req, res) => {
    try {
        const courseOffering = await CourseOffering.findById(req.params.id);

        if (!courseOffering) {
            return res.status(404).json({ success: false, message: 'Khong tim thay hoc phan' });
        }

        const usedCourse = await Enrollment.exists({ courseOfferingId: courseOffering._id });

        if (usedCourse) {
            return res.status(400).json({
                success: false,
                message: 'Khong the xoa hoc phan da co sinh vien dang ky'
            });
        }

        await courseOffering.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Xoa hoc phan thanh cong'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCourseOfferings,
    getCourseOfferingById,
    createCourseOffering,
    updateCourseOffering,
    deleteCourseOffering
};

