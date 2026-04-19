const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const createAdmin = async () => {
    try {
        // Check if admin already exists
        const existing = await Admin.findOne({ email: 'admin@raotravels.com' });
        if (existing) {
            console.log('Admin already exists! Use these credentials:');
            console.log('  Email:    admin@raotravels.com');
            console.log('  Password: admin123');
            process.exit();
        }

        await Admin.create({
            email: 'admin@raotravels.com',
            password: 'admin123'
        });

        console.log('✅ Admin account created successfully!');
        console.log('');
        console.log('  Email:    admin@raotravels.com');
        console.log('  Password: admin123');
        console.log('');
        console.log('⚠️  Change this password in production!');
        process.exit();
    } catch (error) {
        console.error('Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
