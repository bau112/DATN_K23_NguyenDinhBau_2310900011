
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const CourseOffering = require('../models/CourseOffering');

const getEnrollments = async (req, res) => {
    try {
        const { studentId, courseOfferingId, status, page = 1, limit = 10 } = req.query;

        const filter = {};

        if (studentId) filter.studentId = studentId;
        if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
        if (status) filter.status = status;

        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

        const total = await Enrollment.countDocuments(filter);

        const enrollments = await Enrollment.find(filter)
            .populate('studentId', 'studentCode fullName email')
            .populate({
                path: 'courseOfferingId',
                populate: [
                    { path: 'subjectId', select: 'subjectCode subjectName credits' },
                    { path: 'semesterId', select: 'semesterCode semesterName academicYear' },
                    { path: 'classId', select: 'classCode className' },
                    { path: 'teacherId', select: 'username fullName email' }
                ]
            })
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data: enrollments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getEnrollmentById = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('studentId', 'studentCode fullName email')
            .populate('courseOfferingId');

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay dang ky hoc phan'
            });
        }

        res.status(200).json({ success: true, data: enrollment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createEnrollment = async (req, res) => {
    try {
        const { studentId, courseOfferingId } = req.body;

        if (!studentId || !courseOfferingId) {
            return res.status(400).json({
                success: false,
                message: 'Vui long cung cap studentId va courseOfferingId'
            });
        }

        const student = await Student.findById(studentId);

        if (!student || student.status !== 'Active') {
            return res.status(404).json({
                success: false,
                message: 'Sinh vien khong ton tai hoac khong hoat dong'
            });
        }

        const courseOffering = await CourseOffering.findById(courseOfferingId);

        if (!courseOffering || !['Open', 'Active'].includes(courseOffering.status)) {
            return res.status(400).json({
                success: false,
                message: 'Hoc phan khong ton tai hoac khong mo dang ky'
             });
        }

        const existingEnrollment = await Enrollment.findOne({
            studentId,
            courseOfferingId
        });

        if (existingEnrollment) {
            return res.status(409).json({
                success: false,
                message: 'Sinh vien da co ban ghi dang ky hoc phan nay'
            });
        }

        const enrolledCount = await Enrollment.countDocuments({
            courseOfferingId,
            status: 'Enrolled'
        });

        if (enrolledCount >= courseOffering.maxStudents) {
            return res.status(400).json({
                success: false,
                message: 'Hoc phan da dat so luong sinh vien toi da'
            });
        }

        const enrollment = await Enrollment.create({
            studentId,
            courseOfferingId
        });

        const result = await Enrollment.findById(enrollment._id)
            .populate('studentId', 'studentCode fullName email')
            .populate('courseOfferingId');

        res.status(201).json({
            success: true,
            message: 'Dang ky hoc phan thanh cong',
            data: result
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Sinh vien da dang ky hoc phan nay'
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};

const updateEnrollment = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Enrolled', 'Cancelled', 'Completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trang thai dang ky khong hop le'
            });
        }

        const enrollment = await Enrollment.findById(req.params.id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay dang ky hoc phan'
            });
        }

        enrollment.status = status;
        await enrollment.save();

        const result = await Enrollment.findById(enrollment._id)
            .populate('studentId', 'studentCode fullName email')
            .populate('courseOfferingId');

        res.status(200).json({
            success: true,
            message: 'Cap nhat dang ky hoc phan thanh cong',
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteEnrollment = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay dang ky hoc phan'
            });
        }

        await enrollment.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Xoa dang ky hoc phan thanh cong'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment
};
