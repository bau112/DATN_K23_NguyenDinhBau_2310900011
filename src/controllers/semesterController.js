
const Semester = require('../models/Semester');
const CourseOffering = require('../models/CourseOffering');

const getSemesters = async (req, res) => {
    try {
        const { keyword, status, academicYear, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (keyword) {
            filter.$or = [
                { semesterCode: { $regex: keyword, $options: 'i' } },
                { semesterName: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (status) filter.status = status;
        if (academicYear) filter.academicYear = academicYear;

        const currentPage = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

        const total = await Semester.countDocuments(filter);

        const semesters = await Semester.find(filter)
            .sort({ startDate: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data: semesters
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getSemesterById = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);

        if (!semester) {
            return res.status(404).json({ success: false, message: 'Khong tim thay hoc ky' });
        }

        res.status(200).json({ success: true, data: semester });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createSemester = async (req, res) => {
    try {
        const { semesterCode, semesterName, academicYear, startDate, endDate, status } = req.body;

        if (!semesterCode || !semesterName || !academicYear || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Vui long nhap day du thong tin hoc ky' });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ success: false, message: 'Ngay ket thuc phai sau ngay bat dau' });
        }

        const existingSemester = await Semester.findOne({
            semesterCode: semesterCode.trim().toUpperCase()
        });

        if (existingSemester) {
            return res.status(409).json({ success: false, message: 'Ma hoc ky da ton tai' });
        }

        const semester = await Semester.create({
            semesterCode,
            semesterName,
            academicYear,
            startDate,
            endDate,
            status
        });

        res.status(201).json({
            success: true,
            message: 'Them hoc ky thanh cong',
            data: semester
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSemester = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);

        if (!semester) {
            return res.status(404).json({ success: false, message: 'Khong tim thay hoc ky' });
        }

        const allowedFields = ['semesterCode', 'semesterName', 'academicYear', 'startDate', 'endDate', 'status'];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                semester[field] = req.body[field];
            }
        }

        if (semester.startDate >= semester.endDate) {
            return res.status(400).json({ success: false, message: 'Ngay ket thuc phai sau ngay bat dau' });
        }

        await semester.save();

        res.status(200).json({
            success: true,
            message: 'Cap nhat hoc ky thanh cong',
            data: semester
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSemester = async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);

        if (!semester) {
            return res.status(404).json({ success: false, message: 'Khong tim thay hoc ky' });
        }

        const usedSemester = await CourseOffering.exists({ semesterId: semester._id });

        if (usedSemester) {
            return res.status(400).json({
                success: false,
                message: 'Khong the xoa hoc ky dang duoc su dung trong hoc phan'
            });
        }

        await semester.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Xoa hoc ky thanh cong'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSemesters,
    getSemesterById,
    createSemester,
    updateSemester,
    deleteSemester
};
