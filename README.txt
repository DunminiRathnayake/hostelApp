Hostel Management System (HMS)

A comprehensive, production-ready, mobile-first Hostel Management application featuring a secure dynamic QR-based attendance tracking system, round-robin cleaning task generation, digital payment tracking, and automated room allocations. 

Built strictly following layered architectural principles with a React Native frontend and a Service-Oriented Node.js/Express backend.

==============================================
Table of Contents
==============================================
1. Core Features
2. Tech Stack
3. Architecture
4. Installation & Setup
5. Group Contributors

==============================================
1. Core Features
==============================================
* Dynamic QR Attendance: Students generate secure 45-second JWT QR codes. Wardens scan these codes to log entries and exits, backed by a 60-second cooldown and JTI replay-attack prevention. Late arrivals are dynamically flagged.
* Room Management: Automated room capacity tracking, preventing allocation if a room exceeds the strict 3-student limit.
* Automated Cleaning: Generates round-robin cleaning schedules for active rooms dynamically.
* Public Visitor Booking: An unauthenticated portal allowing visitors to request appointments via NIC and Phone numbers, which Wardens can approve or reject.
* Payment Tracking: Secure multipart form uploads (Multer) for uploading and verifying bank slips/receipts.
* Feedback & Complaints: Full system for students to submit issues and review hostel facilities.

==============================================
2. Tech Stack
==============================================
* Frontend: React Native (Expo), React Navigation, Axios, Expo Camera.
* Backend: Node.js, Express.js.
* Database: MongoDB, Mongoose (8 Collections with Object References).
* Security & Validation: JSON Web Tokens (JWT), Joi schema validation, Express-Async-Handler.
* File Uploads: Multer.

==============================================
3. Architecture
==============================================
The application strictly enforces a 3-tier architecture:
- Presentation Layer: React Native screens for Students, Wardens, and Visitors.
- Application Layer: API Gateway -> Authentication/Joi Middleware -> Controllers (11 handlers) -> Service Layer (4 business logic services).
- Data Layer: MongoDB containing Users, Rooms, Logs, Cleaning, Bookings, Payments, Complaints, and Feedback collections.

==============================================
4. Installation & Setup
==============================================
Prerequisites:
- Node.js (v18+)
- Expo Go App on your mobile device (or Android Emulator)
- A MongoDB cluster or local MongoDB instance

Step 1: Clone the repository

Step 2: Setup the Backend
  cd backend
  npm install
  Create a `.env` file in the backend directory with:
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_secure_secret
  npm run dev (Starts the Node server on port 5000)

Step 3: Setup the Frontend
  cd frontend
  npm install
  npm start (Starts the Expo bundler)

Step 4: Scan the QR code
  Use your phone's camera (iOS) or the Expo Go app (Android) to scan the QR code generated in the terminal to launch the mobile app.

==============================================
5. Group Contributors
==============================================
IT24103897 | Rathnayake R.M.D.H.K. (25%)
- Core Architecture, Backend Foundation, Database Design, API Gateway, JWT Authentication & Security, Visitor Management module, and overarching system integrations.

IT24104163 | Manathunga M.M.N.L (15%)
- Check-in / Check-out Management, QR generation/scanning, 60s cooldown logic.

IT24103915 | Guruge O.L. (15%)
- Payment Management, tracking, and receipt verification functionalities.

IT24102154 | Wijesinghe A.P.R.G.L (15%)
- Boarder Management, user profile handling, and hostel records.

IT23219434 | Hettiarachchi M.H.A.I. (15%)
- Room Allocation, capacity tracking, and Cleaning schedule Management.

IT24100463 | Gunasekara H.Y (15%)
- Feedback, Complaint, Rating Management, and public visitor portal.
