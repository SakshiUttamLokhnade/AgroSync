const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // Use pg for PostgreSQL
const multer = require('multer');
const path = require('path');
const bcryptjs = require("bcryptjs");

const server = express();

// Update CORS to include your deployed frontend URL
const corsOptions = {
    origin: ['https://agrosync-3.onrender.com'],
    credentials: true,
};

server.use(cors(corsOptions));
server.use(bodyParser.json());
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Password hashing helpers
async function hashPass(password) {
    return await bcryptjs.hash(password, 10);
}

async function compare(password, hashedPassword) {
    return await bcryptjs.compare(password, hashedPassword);
}

// PostgreSQL Connection Pool using environment variable
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Render's SSL
});

// A wrapper for pool.query to handle database operations
const query = (text, params) => pool.query(text, params);

// Test database connection on startup
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database!');
});

pool.on('error', (err) => {
    console.error('Database connection failed:', err);
});

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`)
});
const upload = multer({ storage: storage });

// Register API
server.post('/register', upload.fields([
    { name: 'utara', maxCount: 1 },
    { name: 'landImage', maxCount: 1 }
]), async (req, res) => {
    const {
        fullName, userType, contact, aadhar,
        password, soilType, waterSource, landArea,
        locationAddress, userName, pincode, preferredCrops
    } = req.body;

    if (!userName || !password) {
        return res.json({ status: false, message: 'Please provide userName and password.' });
    }

    try {
        const hashedPassword = await hashPass(password);

        const userValues = [fullName, userType, contact, aadhar, hashedPassword, userName];
        const insertUserSql = `
            INSERT INTO users (fullName, userType, contact, aadhar, password, userName)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;

        const userResult = await query(insertUserSql, userValues);
        const userId = userResult.rows[0].id;

        if (userType === 'Farmer') {
            const utaraPath = req.files?.utara?.[0]?.filename || '';
            const landImagePath = req.files?.landImage?.[0]?.filename || '';

            const farmValues = [
                userId, soilType, waterSource, landArea,
                locationAddress, pincode, preferredCrops || null,
                utaraPath, landImagePath
            ];

            const insertFarmSql = `
                INSERT INTO farm_details
                (userId, soilType, waterSource, landArea, locationAddress, pincode, preferredCrops, utara_file_path, land_image_path)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

            await query(insertFarmSql, farmValues);
            return res.json({ status: true, message: 'Farmer registered successfully!' });
        } else {
            return res.json({ status: true, message: 'User registered successfully!' });
        }
    } catch (err) {
        console.error('Error during registration:', err);
        return res.json({ status: false, message: 'Registration failed: ' + err.message });
    }
});

// Login API
server.post('/login', async (req, res) => {
    const { userName, password } = req.body;

    if (!userName || !password) {
        return res.json({ status: false, message: 'Please provide username and password.' });
    }

    try {
        const sql = 'SELECT * FROM users WHERE userName = $1';
        const result = await query(sql, [userName]);

        if (result.rows.length === 0) {
            return res.json({ status: false, message: 'Invalid username or password.' });
        }

        const user = result.rows[0];
        const isMatch = await compare(password, user.password);

        if (!isMatch) {
            return res.json({ status: false, message: 'Invalid username or password.' });
        }

        res.json({
            status: true,
            message: 'Login successful!',
            userType: user.usertype,
            farmerId: user.id,
            user: user
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.json({ status: false, message: `Error: ${error.message}` });
    }
});

// Get All Farmers API
server.get('/get-farmers', async (req, res) => {
    const sql = `
        SELECT u.fullname, f.locationaddress, f.landarea,
               f.preferredcrops, f.land_image_path
        FROM users u
        JOIN farm_details f ON u.id = f.userid
        WHERE u.usertype = 'Farmer'`;

    try {
        const result = await query(sql);
        return res.json({ status: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching farmers:', err);
        return res.json({ status: false, message: 'Error fetching farmers', error: err.message });
    }
});

// Forgot Password API
server.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const querySql = 'SELECT * FROM users WHERE username = $1';
        const results = await query(querySql, [email]);

        if (results.rows.length === 0) {
            return res.status(404).json({ message: 'Email not found' });
        }

        return res.status(200).json({ message: 'Reset link sent to your email (simulated)' });
    } catch (err) {
        console.error('DB ERROR:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// Route to fetch farmer profile
server.get('/farmer/profile/:farmerId', async (req, res) => {
    const { farmerId } = req.params;
    try {
        const querySql = 'SELECT * FROM users WHERE id = $1';
        const results = await query(querySql, [farmerId]);
        if (results.rows.length === 0) {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        res.status(200).json(results.rows[0]);
    } catch (err) {
        console.error('Error fetching profile:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Route to update farmer profile
server.put('/farmer/profile/:farmerId', async (req, res) => {
    const { farmerId } = req.params;
    const { fullName, contact, soilType, preferredCrops, locationAddress, pincode } = req.body;

    try {
        const updateUserSql = `
            UPDATE users
            SET fullName = $1, contact = $2
            WHERE id = $3`;
        await query(updateUserSql, [fullName, contact, farmerId]);

        const updateFarmSql = `
            UPDATE farm_details
            SET soilType = $1, preferredCrops = $2, locationAddress = $3, pincode = $4
            WHERE userId = $5`;
        await query(updateFarmSql, [soilType, preferredCrops, locationAddress, pincode, farmerId]);

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Profile update failed', error: err.message });
    }
});

// Route to delete farmer account
server.delete('/farmer/profile/:farmerId', async (req, res) => {
    const { farmerId } = req.params;
    try {
        const querySql = 'DELETE FROM users WHERE id = $1';
        const results = await query(querySql, [farmerId]);
        if (results.rowCount === 0) {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start Server
server.listen(process.env.PORT || 8055, () => {
    console.log(`Server is listening on port ${process.env.PORT || 8055}...`);
});