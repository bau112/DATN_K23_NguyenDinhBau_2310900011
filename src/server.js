
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const semesterRoutes = require('./routes/semesterRoutes');
const courseOfferingRoutes = require('./routes/courseOfferingRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/course-offerings', courseOfferingRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/api/status', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend dang hoat dong',
        project: 'QLDiemSinhVien'
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Khong tim thay API: ${req.method} ${req.originalUrl}`
    });
});

app.use((error, req, res, next) => {
    console.error(error);

    res.status(500).json({
        success: false,
        message: 'Loi may chu',
        error: error.message
    });
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log('QLDIEMSINHVIEN');
        console.log(`Server dang chay tai http://localhost:${PORT}`);
    });
};

startServer();
