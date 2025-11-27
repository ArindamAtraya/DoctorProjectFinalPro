const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error('MONGO_URI not found in environment variables. Please set MONGO_URI in your .env file.');
        }

        console.log('🔗 Connecting to MongoDB...');
        console.log('📍 URI:', mongoURI.replace(/:[^@]*@/, ':****@')); // Hide password

        // NO OPTIONS → Mongoose 7+ uses defaults
        const conn = await mongoose.connect(mongoURI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('💡 Make sure:');
        console.error('  1. Your MONGO_URI in .env is correct');
        console.error('  2. Your IP is whitelisted in MongoDB Atlas (Network Access)');
        console.error('  3. Your internet connection is working');
        process.exit(1);
    }
};

module.exports = connectDB;
