const mongoose = require('mongoose');
const { DB_NAME } = require('../constants');

const connectToDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log("Connected to the database");
    }
    catch (error) {
        console.error('Error connecting to the database', error);
        process.exit(1);
    }
}

module.exports = connectToDB;