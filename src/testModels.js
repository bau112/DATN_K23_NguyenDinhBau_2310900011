
const mongoose = require('mongoose');
require('dotenv').config({
    path: require('path').resolve(__dirname, '../.env')
});

const models = [
    require('./models/Student'),
    require('./models/Class'),
    require('./models/User'),
    require('./models/Subject'),
    require('./models/Semester'),
    require('./models/CourseOffering'),
    require('./models/Enrollment'),
    require('./models/Grade'),
    require('./models/Attendance'),
    require('./models/FaceProfile')
];

async function testModels() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB connected successfully');
        console.log('========== MODEL TEST ==========');

        models.forEach(model => {
            console.log(
                `${model.modelName} -> ${model.collection.name}`
            );
        });

        console.log('================================');
        console.log('All 10 Models loaded successfully');
    } catch (error) {
        console.error('Model test error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testModels();
