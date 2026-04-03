import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbConnection = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    console.log(`MongoDB connected: ${dbConnection.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
