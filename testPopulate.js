
require('dotenv').config();
const mongoose = require('mongoose');

const Enrollment = require('./src/models/Enrollment');
const Student = require('./src/models/Student');
const CourseOffering = require('./src/models/CourseOffering');

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const enrollment = await Enrollment.findById('6afb27f3627a740a27d5022d').lean();

        console.log('RAW ENROLLMENT:');
        console.log(JSON.stringify(enrollment, null, 4));

        console.log('studentId type:', typeof enrollment.studentId);
        console.log('studentId value:', String(enrollment.studentId));

        console.log('courseOfferingId type:', typeof enrollment.courseOfferingId);
        console.log('courseOfferingId value:', String(enrollment.courseOfferingId));

        const studentByEnrollmentId = await Student.findById(enrollment.studentId);
        const courseByEnrollmentId = await CourseOffering.findById(enrollment.courseOfferingId);

        console.log('Student by Enrollment ID:', studentByEnrollmentId);
        console.log('Course by Enrollment ID:', courseByEnrollmentId);

        console.log('Registered models:', mongoose.modelNames());

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
