import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  try {
    const id = '6a0b523de0d68dc1e7952a03'; // hasi's id
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log('Generated token:', token);
    
    const res = await fetch('https://hostelapp-production-3c24.up.railway.app/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response data:', data);
    
    process.exit(0);
  } catch (err) {
    console.error('Error message:', err.message);
    process.exit(1);
  }
};

run();
