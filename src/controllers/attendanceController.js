
const mongoose = require('mongoose');

const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const CourseOffering = require('../models/CourseOffering');

const getAttendances = async (req, res) => {
    try {
        const {
            studentId,
            courseOfferingId,
            attendanceStatus,
            recognitionStatus,
            sessionNumber,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (studentId) filter.studentId = studentId;
        if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
        if (attendanceStatus) filter.attendanceStatus = attendanceStatus;
        if (recognitionStatus) filter.recognitionStatus = recognitionStatus;
        if (sessionNumber) filter.sessionNumber = Number(sessionNumber);

        const currentPage = Math.max(1, Number(page));
        const pageSize = Math.max(1, Math.min(100, Number(limit)));

        const total = await Attendance.countDocuments(filter);

        const data = await Attendance.find(filter)
            .populate('studentId', 'studentCode fullName')
            .populate({
                path: 'courseOfferingId',
                select: 'courseCode subjectId semesterId classId',
                populate: [
                    { path: 'subjectId', select: 'subjectCode subjectName' },
                    { path: 'semesterId', select: 'semesterCode semesterName academicYear' },
                    { path: 'classId', select: 'classCode className' }
                ]
            })
            .sort({ sessionDate: -1, sessionNumber: 1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        return res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getAttendanceById = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id)
            .populate('studentId', 'studentCode fullName')
            .populate({
                path: 'courseOfferingId',
                populate: [
                    { path: 'subjectId' },
                    { path: 'semesterId' },
                    { path: 'classId' }
                ]
            });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay ban ghi diem danh'
            });
        }

        return res.status(200).json({
            success: true,
            data: attendance
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const createAttendance = async (req, res) => {
    try {
        const {
            studentId,
            courseOfferingId,
            sessionDate,
            sessionNumber,
            checkInTime,
            recognitionStatus,
            attendanceStatus,
            method
        } = req.body;

        if (!studentId || !courseOfferingId || !sessionDate || !sessionNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vui long nhap day du thong tin diem danh'
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(studentId) ||
            !mongoose.Types.ObjectId.isValid(courseOfferingId)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Ma sinh vien hoac hoc phan khong hop le'
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
        if (!courseOffering) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay hoc phan'
            });
        }

        const duplicate = await Attendance.findOne({
            studentId,
            courseOfferingId,
            sessionNumber
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: 'Sinh vien da co ban ghi diem danh cho buoi hoc nay'
            });
        }

        const attendance = await Attendance.create({
            studentId,
            courseOfferingId,
            sessionDate,
            sessionNumber,
            checkInTime: checkInTime || null,
            recognitionStatus,
            attendanceStatus,
            method
        });

        const data = await Attendance.findById(attendance._id)
            .populate('studentId', 'studentCode fullName')
            .populate('courseOfferingId', 'courseCode');

        return res.status(201).json({
            success: true,
            message: 'Tao ban ghi diem danh thanh cong',
            data
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Ban ghi diem danh da ton tai'
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay ban ghi diem danh'
            });
        }

        const allowedFields = [
            'sessionDate',
            'sessionNumber',
            'checkInTime',
            'recognitionStatus',
            'attendanceStatus',
            'method'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                attendance[field] = req.body[field];
            }
        });

        await attendance.save();

        const data = await Attendance.findById(attendance._id)
            .populate('studentId', 'studentCode fullName')
            .populate('courseOfferingId', 'courseCode');

        return res.status(200).json({
            success: true,
            message: 'Cap nhat diem danh thanh cong',
            data
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Ban ghi diem danh da ton tai'
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay ban ghi diem danh'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xoa ban ghi diem danh thanh cong'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAttendances,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance
};
