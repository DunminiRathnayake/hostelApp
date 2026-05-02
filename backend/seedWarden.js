import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const seedWarden = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Check if warden already exists
    const existingWarden = await User.findOne({ email: 'warden@hostel.com' });
    
    if (existingWarden) {
      console.log('Warden account already exists. Deleting it to recreate...');
      await User.deleteOne({ email: 'warden@hostel.com' });
    }

    // Create default warden (password is automatically hashed by Mongoose pre-save hook)
    await User.create({
      name: 'Hostel Warden',
      email: 'warden@hostel.com',
      password: 'warden123',
      role: 'warden' // Warden and Admin share the same role access in the app
    });

    console.log('✅ Default Warden account created successfully!');
    console.log('-----------------------------------');
    console.log('Email: warden@hostel.com');
    console.log('Password: warden123');
    console.log('-----------------------------------');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding warden:', error);
    process.exit(1);
  }
};

seedWarden();
