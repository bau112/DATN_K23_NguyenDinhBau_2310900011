
const Student = require('../models/Student');
const Class = require('../models/Class');
const User = require('../models/User');

const getStudents = async (req, res) => {
    try {
        const { keyword, classId, status, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (keyword) {
            filter.$or = [
                { studentCode: { $regex: keyword, $options: 'i' } },
                { fullName: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (classId) filter.classId = classId;
        if (status) filter.status = status;

        const currentPage = Math.max(1, Number(page));
        const pageSize = Math.min(100, Math.max(1, Number(limit)));
        const total = await Student.countDocuments(filter);

        const students = await Student.find(filter)
            .populate('classId', 'classCode className')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageSize),
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('classId', 'classCode className');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay sinh vien'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getMyStudentProfile = async (req, res) => {
    try {
        if (req.user.role !== 'Student') {
            return res.status(403).json({
                success: false,
                message: 'Khong co quyen truy cap'
            });
        }

        let user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay tai khoan'
            });
        }

        let student = null;

        if (user.studentId) {
            student = await Student.findById(user.studentId)
                .populate('classId', 'classCode className');
        } else {
            const email = user.email.trim().toLowerCase();

            const matchedStudents = await Student.find({ email }).limit(2);

            if (matchedStudents.length > 1) {
                return res.status(409).json({
                    success: false,
                    message: 'Email trung voi nhieu ho so sinh vien. Vui long lien he Admin.'
                });
            }

            if (matchedStudents.length === 1) {
                student = matchedStudents[0];

                const linkedUser = await User.findOne({
                    studentId: student._id,
                    _id: { $ne: user._id }
                });

                if (linkedUser) {
                    return res.status(409).json({
                        success: false,
                        message: 'Ho so sinh vien da duoc lien ket voi tai khoan khac'
                    });
                }

                user.studentId = student._id;
                await user.save();

                student = await Student.findById(student._id)
                    .populate('classId', 'classCode className');
            }
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Chua tim thay ho so sinh vien khop voi email tai khoan. Vui long lien he Admin.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lay thong tin ca nhan thanh cong',
            data: student
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const createStudent = async (req, res) => {
    try {
        const {
            studentCode,
            fullName,
            dateOfBirth,
            gender,
            email,
            phone,
            address,
            classId,
            academicYear
        } = req.body;

        if (!studentCode || !fullName || !email || !classId) {
            return res.status(400).json({
                success: false,
                message: 'Vui long nhap ma sinh vien, ho ten, email va lop'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingStudent = await Student.findOne({
            $or: [
                { studentCode },
                { email: normalizedEmail }
            ]
        });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: 'Ma sinh vien hoac email da ton tai'
            });
        }

        const student = await Student.create({
            studentCode,
            fullName,
            dateOfBirth,
            gender,
            email: normalizedEmail,
            phone,
            address,
            classId,
            academicYear,
            status: 'Active'
        });

        res.status(201).json({
            success: true,
            message: 'Them sinh vien thanh cong',
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay sinh vien'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cap nhat sinh vien thanh cong',
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay sinh vien'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xoa sinh vien thanh cong'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    getMyStudentProfile,
    createStudent,
    updateStudent,
    deleteStudent
};
