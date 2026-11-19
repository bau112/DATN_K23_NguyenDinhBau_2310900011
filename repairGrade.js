
const mongoose = require('mongoose');
require('dotenv').config();

const Grade = require('./src/models/Grade');
const Student = require('./src/models/Student');
const CourseOffering = require('./src/models/CourseOffering');

const repairGrade = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const gradeId = new mongoose.Types.ObjectId('6afb2984627a740a27d50232');

        const grade = await Grade.collection.findOne({ _id: gradeId });

        if (!grade) {
            throw new Error('Khong tim thay ban ghi diem');
        }

        const studentId = grade.studentId?.$oid;
        const courseOfferingId = grade.courseOfferingId?.$oid;

        if (!studentId || !courseOfferingId) {
            console.log('Du lieu khong co dang Object $oid can sua:');
            console.log(grade);
            return;
        }

        const studentObjectId = new mongoose.Types.ObjectId(studentId);
        const courseObjectId = new mongoose.Types.ObjectId(courseOfferingId);

        const student = await Student.findById(studentObjectId);
        const course = await CourseOffering.findById(courseObjectId);

        if (!student || !course) {
            throw new Error('Khong tim thay sinh vien hoac hoc phan tham chieu');
        }

        const result = await Grade.collection.updateOne(
            { _id: gradeId },
            {
                $set: {
                    studentId: studentObjectId,
                    courseOfferingId: courseObjectId
                }
            }
        );

        console.log('Repair result:', result);

        const repairedGrade = await Grade.findById(gradeId)
            .populate('studentId')
            .populate('courseOfferingId');

        console.log('POPULATE RESULT:');
        console.log(JSON.stringify(repairedGrade, null, 2));
    } catch (error) {
        console.error('Repair error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

repairGrade();
