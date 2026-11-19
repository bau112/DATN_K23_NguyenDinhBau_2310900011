
require('dotenv').config();
const mongoose = require('mongoose');

const Enrollment = require('./src/models/Enrollment');
const Student = require('./src/models/Student');
const CourseOffering = require('./src/models/CourseOffering');

const runRepair = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const enrollmentId = new mongoose.Types.ObjectId('6afb27f3627a740a27d5022d');

        const enrollment = await Enrollment.collection.findOne({
            _id: enrollmentId
        });

        if (!enrollment) {
            throw new Error('Khong tim thay ban ghi Enrollment');
        }

        const studentId = enrollment.studentId?.$oid;
        const courseOfferingId = enrollment.courseOfferingId?.$oid;

        if (!studentId || !courseOfferingId) {
            throw new Error('Du lieu lien ket khong dung dinh dang du kien');
        }

        const student = await Student.findById(studentId);
        const courseOffering = await CourseOffering.findById(courseOfferingId);

        if (!student || !courseOffering) {
            throw new Error('Khong tim thay sinh vien hoac hoc phan goc');
        }

        const result = await Enrollment.collection.updateOne(
            { _id: enrollmentId },
            {
                $set: {
                    studentId: new mongoose.Types.ObjectId(studentId),
                    courseOfferingId: new mongoose.Types.ObjectId(courseOfferingId)
                }
            }
        );

        console.log('Repair result:', result);

        const repairedEnrollment = await Enrollment.findById(enrollmentId)
            .populate('studentId', 'studentCode fullName email')
            .populate('courseOfferingId');

        console.log('POPULATE RESULT:');
        console.log(JSON.stringify(repairedEnrollment, null, 4));

    } catch (error) {
        console.error('Repair error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

runRepair();
