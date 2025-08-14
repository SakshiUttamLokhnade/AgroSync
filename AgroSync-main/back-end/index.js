require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysqlPromise = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const bcryptjs = require("bcryptjs");
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const server = express();
server.use(express.json());

const { v4: uuidv4 } = require('uuid');

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://agrosync-frontend.onrender.com' // Corrected frontend URL
    ],
    credentials: true,
};

server.use(cors(corsOptions));
server.use(bodyParser.json());

// Serving static files from the 'uploads' directory
// NOTE: This will not work on Render's ephemeral file system.
// For a production app, you should use a cloud storage service like AWS S3.
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Corrected Database Connection to use Render's DATABASE_URL
const promisePool = mysqlPromise.createPool(process.env.DATABASE_URL);

// Password hashing helpers
async function hashPass(password) {
    return await bcryptjs.hash(password, 10);
}

async function compare(password, hashedPassword) {
    return await bcryptjs.compare(password, hashedPassword);
}

// Multer Setup
// WARNING: This will upload to a temporary directory on Render that gets deleted on restart.
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
          VALUES (?, ?, ?, ?, ?, ?)`;

        const [rows] = await promisePool.execute(insertUserSql, userValues);
        const userId = rows.insertId;

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
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            await promisePool.execute(insertFarmSql, farmValues);

            return res.json({ status: true, message: 'Farmer registered successfully!' });
        } else {
            return res.json({ status: true, message: 'User registered successfully!' });
        }
    } catch (err) {
        console.error('Registration failed:', err);
        return res.json({ status: false, message: 'Registration failed: ' + err.message });
    }
});

// Login API
server.post('/login', async (req, res) => {
    const { userName, password } = req.body;

    if (!userName || !password) {
        return res.json({ status: false, message: 'Please provide username and password.' });
    }

    const sql = 'SELECT * FROM users WHERE userName = ?';
    const [rows] = await promisePool.execute(sql, [userName]);

    if (rows.length === 0) {
        return res.json({ status: false, message: 'Invalid username or password.' });
    }

    const user = rows[0];
    const isMatch = await compare(password, user.password);

    if (!isMatch) {
        return res.json({ status: false, message: 'Invalid username or password.' });
    }

    res.json({
        status: true,
        message: 'Login successful!',
        userType: user.userType,
        farmerId: user.userType === 'Farmer' ? user.id : null,
        contractorId: user.userType === 'Contractor' ? user.id : null,
        user: user
    });
});

// Get All Farmers API
server.get('/get-farmers', async (req, res) => {
    const sql = `
      SELECT 
        u.id as userId,
        u.fullName, 
        f.locationAddress, 
        f.landArea,
        f.preferredCrops, 
        f.land_image_path
      FROM users u
      JOIN farm_details f ON u.id = f.userId
      WHERE u.userType = 'Farmer'`;

    try {
        const [rows] = await promisePool.execute(sql);
        return res.json({ status: true, data: rows });
    } catch (err) {
        console.error('Error fetching farmers:', err);
        return res.status(500).json({ status: false, message: 'Failed to fetch farmers.' });
    }
});

// Forgot Password API
server.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const [rows] = await promisePool.execute('SELECT * FROM users WHERE userName = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Email not found' });
        }
        // NOTE: This part needs a proper email sending service.
        return res.status(200).json({ message: 'Reset link sent to your email (simulated)' });
    } catch (err) {
        console.error('DB ERROR:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// Standard response format helper
const sendResponse = (res, status, data, message = '') => {
    return res.status(status).json({
        status: status >= 200 && status < 300,
        data,
        message
    });
};

// Route to fetch farmer profile
server.get('/farmer/profile/:farmerId', async (req, res) => {
    const { farmerId } = req.params;
    const query = `
      SELECT 
        users.id as userId,
        users.fullName,
        users.contact,
        users.userType,
        farm_details.farm_id as farmId,
        farm_details.soilType,
        farm_details.waterSource,
        farm_details.landArea,
        farm_details.locationAddress,
        farm_details.pincode,
        farm_details.preferredCrops,
        farm_details.utara_file_path,
        farm_details.land_image_path,
        farm_details.created_at AS farmCreatedAt
      FROM users
      INNER JOIN farm_details ON users.id = farm_details.userId
      WHERE users.id = ? AND users.userType = 'Farmer'`;

    try {
        const [rows] = await promisePool.execute(query, [farmerId]);
        if (rows.length === 0) {
            return sendResponse(res, 404, null, 'Farmer not found');
        }
        const farmerData = rows[0];
        return sendResponse(res, 200, farmerData, 'Farmer profile retrieved successfully');
    } catch (err) {
        console.error('Error fetching farmer profile:', err);
        return sendResponse(res, 500, null, 'Server error while fetching farmer profile');
    }
});

// Route to update farmer profile
server.put('/farmer/profile/:farmerId', async (req, res) => {
    const { farmerId } = req.params;
    const { fullName, contact, soilType, preferredCrops, locationAddress, pincode } = req.body;

    const updateUserSql = `
      UPDATE users 
      SET fullName = ?, contact = ?
      WHERE id = ?`;

    const updateFarmSql = `
      UPDATE farm_details 
      SET soilType = ?, preferredCrops = ?, locationAddress = ?, pincode = ?
      WHERE userId = ?`;

    try {
        await promisePool.execute(updateUserSql, [fullName, contact, farmerId]);
        await promisePool.execute(updateFarmSql, [soilType, preferredCrops, locationAddress, pincode, farmerId]);
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'Profile update failed', error: err.message });
    }
});

// Route to delete farmer account
server.delete('/farmer/profile/:farmerId', async (req, res) => {
    const { farmerId } = req.params;
    try {
        await promisePool.execute('DELETE FROM farm_details WHERE userId = ?', [farmerId]);
        const [userResult] = await promisePool.execute('DELETE FROM users WHERE id = ?', [farmerId]);
        if (userResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        res.status(200).json({ message: 'Farmer account and details deleted successfully' });
    } catch (err) {
        console.error('Error deleting account:', err);
        return res.status(500).json({ message: 'Server error while deleting account' });
    }
});

// Route to fetch contractor profile
server.get('/contractor/profile/:contractorId', async (req, res) => {
    const { contractorId } = req.params;
    const query = 'SELECT * FROM users WHERE id = ? AND userType = "Contractor"';
    try {
        const [rows] = await promisePool.execute(query, [contractorId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Contractor not found' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error fetching contractor profile:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Route to update contractor profile
server.put('/contractor/profile/:contractorId', async (req, res) => {
    const { contractorId } = req.params;
    const { fullName, contact } = req.body;
    const updateQuery = 'UPDATE users SET fullName = ?, contact = ? WHERE id = ? AND userType = "Contractor"';
    try {
        const [result] = await promisePool.execute(updateQuery, [fullName, contact, contractorId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contractor not found or no changes made' });
        }
        return res.status(200).json({ message: 'Contractor profile updated successfully' });
    } catch (err) {
        console.error('Error updating contractor:', err);
        return res.status(500).json({ message: 'Update failed' });
    }
});

// Route to delete contractor profile
server.delete('/contractor/profile/:contractorId', async (req, res) => {
    const contractorId = req.params.contractorId;
    try {
        const [result] = await promisePool.execute('DELETE FROM users WHERE id = ? AND userType = "Contractor"', [contractorId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contractor not found' });
        }
        res.status(200).json({ message: 'Contractor account deleted successfully' });
    } catch (err) {
        console.error('Error deleting contractor:', err);
        return res.status(500).json({ message: 'Failed to delete account' });
    }
});

// Send SMS Message API (Corrected)
server.post('/send-sms', async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
        return sendResponse(res, 400, null, 'Phone number and message are required');
    }
    const formattedNumber = formatIndianNumber(to); // Use a helper function
    if (!formattedNumber) {
        return sendResponse(res, 400, null, 'Invalid phone number format');
    }
    try {
        const smsResponse = await twilio.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedNumber // Use the 'to' from the request body
        });
        return sendResponse(res, 200, { sid: smsResponse.sid }, 'Message sent successfully');
    } catch (error) {
        console.error('Error sending SMS:', error);
        return sendResponse(res, 500, null, 'Failed to send message');
    }
});

// Send Farmer Contact Message API
server.post('/send-farmer-message', async (req, res) => {
    const { farmerId, message, contractorName, contractorId } = req.body;
    if (!farmerId || !message || !contractorName || !contractorId) {
        return sendResponse(res, 400, null, 'All fields are required');
    }
    try {
        const [contractorResults] = await promisePool.execute('SELECT * FROM users WHERE id = ? AND userType = "Contractor"', [contractorId]);
        if (contractorResults.length === 0) {
            return sendResponse(res, 403, null, 'Invalid contractor or unauthorized access');
        }
        const [farmerResults] = await promisePool.execute('SELECT contact FROM users WHERE id = ? AND userType = "Farmer"', [farmerId]);
        if (farmerResults.length === 0) {
            return sendResponse(res, 404, null, 'Farmer not found');
        }
        const farmerContact = farmerResults[0].contact;
        const formattedNumber = formatIndianNumber(farmerContact);
        if (!formattedNumber) {
            return sendResponse(res, 400, null, 'Invalid farmer phone number format');
        }
        const smsResponse = await twilio.messages.create({
            body: `[AgroSync] New Interest from ${contractorName} (Contractor ID: ${contractorId}):\n${message}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedNumber
        });
        return sendResponse(res, 200, { sid: smsResponse.sid }, 'Message sent successfully');
    } catch (error) {
        console.error('Error sending SMS:', error);
        return sendResponse(res, 500, null, 'Failed to send message');
    }
});

// Get all farms for a specific farmer
server.get('/:farmerId', async (req, res) => {
    const farmerId = req.params.farmerId;
    try {
        const [rows] = await promisePool.execute('SELECT * FROM farm_details WHERE userId = ?', [farmerId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No farms found for this user' });
        }
        res.json(rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add a new farm
server.post('/add', async (req, res) => {
    const {
        userId, soilType, waterSource, landArea, locationAddress, pincode, preferredCrops
    } = req.body;
    const farm_id = uuidv4().slice(0, 20);
    const query = `INSERT INTO farm_details (farm_id, userId, soilType, waterSource, landArea, locationAddress, pincode, preferredCrops) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [farm_id, userId, soilType, waterSource, landArea, locationAddress, pincode, preferredCrops];
    try {
        const [result] = await promisePool.execute(query, values);
        if (result.affectedRows > 0) {
            res.json({ message: 'Farm added successfully' });
        } else {
            res.status(500).json({ error: 'Failed to add farm' });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to add farm' });
    }
});

// Edit farm
server.put('/:id', async (req, res) => {
    const farmId = req.params.id;
    const { soilType, waterSource, landArea, locationAddress, pincode, preferredCrops } = req.body;
    const query = `UPDATE farm_details SET soilType = ?, waterSource = ?, landArea = ?, locationAddress = ?, pincode = ?, preferredCrops = ? WHERE farm_id = ?`;
    const values = [soilType, waterSource, landArea, locationAddress, pincode, preferredCrops, farmId];
    try {
        const [result] = await promisePool.execute(query, values);
        if (result.affectedRows > 0) {
            res.json({ message: 'Farm updated successfully' });
        } else {
            res.status(500).json({ error: 'Failed to update farm' });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to update farm' });
    }
});

// Delete farm
server.delete('/:id', async (req, res) => {
    const farmId = req.params.id;
    try {
        const [result] = await promisePool.execute('DELETE FROM farm_details WHERE farm_id = ?', [farmId]);
        if (result.affectedRows > 0) {
            res.json({ message: 'Farm deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete farm' });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to delete farm' });
    }
});

// POST /agreements - Create a new agreement proposal
server.post('/agreements', async (req, res) => {
    let { farmId, farmerId, contractorId, contract_details, amount, terms, start_date, end_date, contractor_signature,
        agreement_type, profit_share, sale_price, payment_method, crop_type, penalty_clause, renewal_option } = req.body;

    if (Array.isArray(terms)) {
        terms = JSON.stringify(terms);
    }
    
    if (!farmId || !farmerId || !contractorId || !amount || !terms || !start_date || !end_date) {
        return res.status(400).json({ status: false, message: 'Missing required fields.' });
    }
    
    if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({ status: false, message: 'End date must be after start date.' });
    }
    
    try {
        const [farmerResult] = await promisePool.execute('SELECT id FROM users WHERE id = ? AND userType = "Farmer"', [farmerId]);
        if (farmerResult.length === 0) {
            return res.status(400).json({ status: false, message: 'Invalid farmer ID. Farmer not found.' });
        }

        const [contractorResult] = await promisePool.execute('SELECT id FROM users WHERE id = ? AND userType = "Contractor"', [contractorId]);
        if (contractorResult.length === 0) {
            return res.status(400).json({ status: false, message: 'Invalid contractor ID. Contractor not found.' });
        }
        
        const insertSql = `
            INSERT INTO agreements (
                farmId, farmerId, contractorId, contract_details, amount, terms, start_date, end_date, status,
                contractor_signature, agreement_type, profit_share, sale_price, payment_method, crop_type, penalty_clause, renewal_option
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            farmId, farmerId, contractorId, contract_details, amount, terms, start_date, end_date,
            contractor_signature || null, agreement_type || null, profit_share || null, sale_price || null,
            payment_method || null, crop_type || null, penalty_clause || null, renewal_option || null
        ];
        
        const [result] = await promisePool.execute(insertSql, values);
        if (result.affectedRows > 0) {
            const createdAgreementId = result.insertId;
            try {
                const [farmerRows] = await promisePool.execute('SELECT contact FROM users WHERE id = ? AND userType = "Farmer"', [farmerId]);
                if (farmerRows.length > 0) {
                    const farmerContact = farmerRows[0].contact;
                    const formattedNumber = formatIndianNumber(farmerContact);
                    if (formattedNumber) {
                        await twilio.messages.create({
                            body: 'You have received a new agreement on your profile.',
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: formattedNumber
                        });
                    }
                }
            } catch (fetchErr) {
                console.error('Error fetching farmer contact for SMS:', fetchErr);
            }
            return res.status(201).json({ status: true, agreementId: createdAgreementId, message: 'Agreement proposed successfully.' });
        } else {
            return res.status(500).json({ status: false, message: 'Failed to create agreement record.' });
        }
    } catch (err) {
        console.error("Error creating agreement:", err);
        return res.status(500).json({ status: false, message: 'Database error while creating agreement.', details: err.message });
    }
});

// GET /agreements/user/:userId - Get agreements for a specific user
server.get('/agreements/user/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ status: false, message: 'User ID is required.' });
    }
    const query = `
        SELECT a.*, f.fullName AS farmerName, f.contact AS farmerContact, c.fullName AS contractorName
        FROM agreements a
        JOIN users f ON a.farmerId = f.id
        JOIN users c ON a.contractorId = c.id
        WHERE a.farmerId = ? OR a.contractorId = ?
        ORDER BY a.created_at DESC`;
    try {
        const [results] = await promisePool.execute(query, [userId, userId]);
        return res.status(200).json({ status: true, data: results });
    } catch (err) {
        console.error("[ERROR] Fetching agreements:", err);
        return res.status(500).json({ status: false, message: 'Database error while fetching agreements.' });
    }
});

// PUT /agreements/:agreementId/status - Update agreement status (Accept/Reject)
server.put('/agreements/:agreementId/status', async (req, res) => {
    const { agreementId } = req.params;
    const { status, userId, signature } = req.body;
    if (!agreementId || !status || !userId) {
        return res.status(400).json({ status: false, message: 'Agreement ID, status, and user ID are required.' });
    }
    const validStatuses = ['Accepted', 'Rejected'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: false, message: 'Invalid status provided. Must be "Accepted" or "Rejected".' });
    }
    const findAgreementSql = 'SELECT * FROM agreements WHERE agreementId = ?';
    try {
        const [findResults] = await promisePool.execute(findAgreementSql, [agreementId]);
        if (findResults.length === 0) {
            return res.status(404).json({ status: false, message: 'Agreement not found.' });
        }
        const agreement = findResults[0];
        if (agreement.status !== 'Pending') {
            return res.status(400).json({ status: false, message: `Agreement already ${agreement.status.toLowerCase()}.` });
        }
        if (Number(agreement.farmerId) !== Number(userId)) {
            return res.status(403).json({ status: false, message: 'Only the farmer can accept or reject the agreement.' });
        }
        let updateSql, updateValues;
        if (status === 'Accepted' && signature) {
            updateSql = 'UPDATE agreements SET status = ?, farmer_signature = ?, updated_at = NOW() WHERE agreementId = ?';
            updateValues = [status, signature, agreementId];
        } else {
            updateSql = 'UPDATE agreements SET status = ?, updated_at = NOW() WHERE agreementId = ?';
            updateValues = [status, agreementId];
        }
        const [updateResult] = await promisePool.execute(updateSql, updateValues);
        if (updateResult.affectedRows > 0) {
            if (status === 'Accepted') {
                try {
                    await promisePool.execute('UPDATE farm_details SET status = ? WHERE farm_id = ?', ['in_use', agreement.farmId]);
                } catch (farmUpdateErr) {
                    console.error('Error updating farm status:', farmUpdateErr);
                }
            }
            try {
                const [contractorRows] = await promisePool.execute('SELECT contact FROM users WHERE id = ? AND userType = "Contractor"', [agreement.contractorId]);
                if (contractorRows.length > 0) {
                    const contractorContact = contractorRows[0].contact;
                    const formattedContractorNumber = formatIndianNumber(contractorContact);
                    if (formattedContractorNumber) {
                        let statusMsg = status === 'Accepted' ? 'Your agreement has been accepted. The farm is now marked as in use.' : 'Your agreement has been rejected.';
                        await twilio.messages.create({
                            body: statusMsg,
                            from: process.env.TWILIO_PHONE_NUMBER,
                            to: formattedContractorNumber
                        });
                    }
                }
            } catch (fetchErr) {
                console.error('Error in SMS sending process:', fetchErr);
            }
            return res.status(200).json({ status: true, agreementId: agreementId, newStatus: status, message: `Agreement ${status.toLowerCase()} successfully.` });
        } else {
            return res.status(500).json({ status: false, message: 'Failed to update agreement status.' });
        }
    } catch (error) {
        console.error('[ERROR] Error in agreement status update:', error);
        return res.status(500).json({ status: false, message: 'An error occurred while updating the agreement status.', error: error.message });
    }
});

// DELETE /agreements/:agreementId - Delete an agreement
server.delete('/agreements/:agreementId', async (req, res) => {
    const { agreementId } = req.params;
    if (!agreementId) {
        return res.status(400).json({ status: false, message: 'Agreement ID is required.' });
    }
    try {
        const [result] = await promisePool.execute('DELETE FROM agreements WHERE agreementId = ?', [agreementId]);
        if (result.affectedRows > 0) {
            return res.status(200).json({ status: true, message: 'Agreement deleted successfully.' });
        } else {
            return res.status(404).json({ status: false, message: 'Agreement not found.' });
        }
    } catch (err) {
        return res.status(500).json({ status: false, message: 'Database error while deleting agreement.' });
    }
});

// API Route to get contractors data
server.get('/api/contractors', async (req, res) => {
    try {
        const [rows] = await promisePool.execute('SELECT * FROM users WHERE userType = "Contractor"');
        const contractors = rows.map(contractor => ({
            id: contractor.id,
            name: contractor.fullName,
            contact: contractor.contact,
            image: contractor.image || 'https://via.placeholder.com/150'
        }));
        res.json(contractors);
    } catch (error) {
        console.error('Error fetching contractors:', error);
        res.status(500).json({ error: 'Failed to fetch contractors data', message: error.message });
    }
});

// GET /farms - Get all farms with their agreement status
server.get('/farms', async (req, res) => {
    try {
        const [farms] = await promisePool.execute(`
          SELECT f.*, u.fullName,
          CASE
            WHEN a.status = 'Accepted' THEN 'in_use'
            ELSE f.status
          END as display_status
          FROM farm_details f
          LEFT JOIN users u ON f.userId = u.id
          LEFT JOIN agreements a ON f.farmId = a.farmId AND a.status = 'Accepted'
        `);
        res.json(farms);
    } catch (error) {
        console.error('Error fetching farms:', error);
        res.status(500).json({ error: 'Failed to fetch farms', details: error.message });
    }
});

// Update the formatIndianNumber function to be more lenient
function formatIndianNumber(raw) {
    if (!raw) {
        return null;
    }
    let cleaned = String(raw).replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned}`;
    }
    return null;
}

// GET /agreements/active-farms - Get farms with active agreements
server.get('/agreements/active-farms', async (req, res) => {
    try {
        const [results] = await promisePool.execute(`
          SELECT DISTINCT farmId 
          FROM agreements 
          WHERE status = 'Accepted' AND farmId IS NOT NULL
        `);
        res.json({ status: true, data: results });
    } catch (error) {
        console.error('Error fetching farms with active agreements:', error);
        res.status(500).json({ status: false, message: 'Failed to fetch farms with active agreements', error: error.message });
    }
});

// Start Server (Corrected)
const port = process.env.PORT || 8055;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});