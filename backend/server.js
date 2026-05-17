const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Set HTTP security headers
app.use(helmet());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// General API Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        status: 429,
        message: 'Too many requests from this IP, please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Safe CORS handling
const allowedOrigins = [
    'http://localhost',
    'http://localhost:5000',
    'http://localhost:80',
    'http://127.0.0.1',
    'https://raotravels-backend.onrender.com'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS due to security policy'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser with 10kb limit to prevent payload-size DoS attacks
app.use(express.json({ limit: '10kb' }));

// Route files
const tourRoutes    = require('./routes/tourRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const aiRoutes      = require('./routes/aiRoutes');
const vendorRoutes  = require('./routes/vendorRoutes');

// Mount routers
app.use('/api/tours',    tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/vendor',   vendorRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('RAO Travels API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
