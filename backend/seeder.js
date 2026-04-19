const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/Tour');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

// Read JSON files
const toursData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'tours.json'), 'utf-8')
);

const importData = async () => {
    try {
        await Tour.create(toursData);
        console.log('Sample Tours Imported Successfully! ✅');
        process.exit();
    } catch (error) {
        console.error('Error importing data: ', error);
        process.exit(1);
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('All Tours Deleted Successfully! 🗑️');
        process.exit();
    } catch (error) {
        console.error('Error deleting data: ', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    deleteData();
} else {
    importData();
}
