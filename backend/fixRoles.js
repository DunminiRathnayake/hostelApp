import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).map(file => path.join(routesDir, file));
files.push(path.join(__dirname, 'middleware', 'authMiddleware.js'));
files.push(path.join(__dirname, 'models', 'User.js'));
files.push(path.join(__dirname, '..', 'frontend', 'app', '(auth)', 'login.tsx'));
files.push(path.join(__dirname, '..', 'frontend', 'screens', 'LoginScreen.js'));

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // In authMiddleware.js
    content = content.replace(/adminOnly/g, 'wardenOnly');
    content = content.replace(/req\.user\?\.role === 'admin'/g, "req.user?.role === 'warden'");
    content = content.replace(/Requires admin role/g, 'Requires warden role');
    
    // In routes
    content = content.replace(/authorizeRoles\('admin', 'warden'\)/g, "authorizeRoles('warden')");
    content = content.replace(/adminOnly/g, 'wardenOnly');
    content = content.replace(/warden\/admin/g, 'warden');
    content = content.replace(/Admin or Warden/g, 'Warden');
    content = content.replace(/admin or warden/g, 'warden');
    
    // In models/User.js
    content = content.replace(/enum: \['student', 'warden', 'admin', 'visitor'\],/g, "enum: ['student', 'warden', 'visitor'],");
    
    // In frontend LoginScreen (if role logic exists)
    content = content.replace(/role === 'admin'/g, "role === 'warden'");
    content = content.replace(/res\.data\.role === 'admin'/g, "res.data.role === 'warden'");

    fs.writeFileSync(file, content);
  }
});

console.log('Roles merged successfully.');
