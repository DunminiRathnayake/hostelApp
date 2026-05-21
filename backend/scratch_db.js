import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');
    
    // Check "test" database
    const testDb = conn.connection.useDb('test');
    const uTest = await testDb.db.collection('users').findOne({ email: 'teststudent@gmail.com' });
    console.log('User in "test":', uTest);
    
    // Check "HostelDB" database
    const hostelDb = conn.connection.useDb('HostelDB');
    const uHostel = await hostelDb.db.collection('users').findOne({ email: 'teststudent@gmail.com' });
    console.log('User in "HostelDB":', uHostel);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
