
const mongoose = require('mongoose');
require('dotenv').config();

const Attendance = require('./src/models/Attendance');
const Student = require('./src/models/Student');
const CourseOffering = require('./src/models/CourseOffering');

const repairAttendance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const attendanceId = new mongoose.Types.ObjectId('6afb2acd627a740a27d5023e');

        const attendance = await Attendance.collection.findOne({
            _id: attendanceId
        });

        if (!attendance) {
            throw new Error('Khong tim thay ban ghi diem danh');
        }

        const studentId = attendance.studentId?.$oid;
        const courseOfferingId = attendance.courseOfferingId?.$oid;

        if (!studentId || !courseOfferingId) {
            console.log('Du lieu tham chieu khong co dang Object $oid:');
            console.log(attendance);
            return;
        }

        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const courseObjectId = new mongoose.Types.ObjectId(courseOfferingId);

        const student = await Student.findById(studentObjectId);
        const course = await CourseOffering.findById(courseObjectId);

        if (!student || !course) {
            throw new Error('Khong tim thay sinh vien hoac hoc phan tham chieu');
        }

        const result = await Attendance.collection.updateOne(
            { _id: attendanceId },
            {
                $set: {
                    studentId: studentObjectId,
                    courseOfferingId: courseObjectId
                }
            }
        );

        console.log('Repair result:', result);

        const repairedAttendance = await Attendance.findById(attendanceId)
            .populate('studentId')
            .populate('courseOfferingId');

        console.log('POPULATE RESULT:');
        console.log(JSON.stringify(repairedAttendance, null, 2));
    } catch (error) {
        console.error('Repair error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

repairAttendance();
