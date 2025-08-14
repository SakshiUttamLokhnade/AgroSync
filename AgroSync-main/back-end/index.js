require('dotenv').config();

const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const mysqlPromise = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const bcryptjs = require("bcryptjs");
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)

const server = express();
server.use(express.json());

const { v4: uuidv4 } = require('uuid');

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
};

server.use(cors(corsOptions));

server.use(bodyParser.json());
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const promisePool = mysqlPromise.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Sakshi@123',
  database: 'agrosync',
  port: '3306'
});

// Password hashing helpers
async function hashPass(password) {
  return await bcryptjs.hash(password, 10);
}

async function compare(password, hashedPassword) {
  return await bcryptjs.compare(password, hashedPassword);
}

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
    return res.json({ status: false, message: 'Password hashing failed: ' + err.message });
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

  const [rows] = await promisePool.execute(sql);

  return res.json({ status: true, data: rows });
});

// Forgot Password API
server.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const query = 'SELECT * FROM users WHERE userName = ?'; // assuming email = userName

  promisePool.execute(query, [email])
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Email not found' });
      }

      // Simulate sending email (actual email sending logic can be added later)
      return res.status(200).json({ message: 'Reset link sent to your email (simulated)' });
    })
    .catch((err) => {
      console.error('DB ERROR:', err);
      return res.status(500).json({ message: 'Database error' });
    });
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
server.get('/farmer/profile/:farmerId', (req, res) => {
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
    WHERE users.id = ? AND users.userType = 'Farmer'
  `;

  promisePool.execute(query, [farmerId])
    .then(([rows]) => {
      if (rows.length === 0) {
        return sendResponse(res, 404, null, 'Farmer not found');
      }

      const farmerData = {
        userId: rows[0].userId,
        fullName: rows[0].fullName || '',
        contact: rows[0].contact || '',
        userType: rows[0].userType || 'Farmer',
        farmId: rows[0].farmId,
        soilType: rows[0].soilType || '',
        waterSource: rows[0].waterSource || '',
        landArea: rows[0].landArea || '',
        locationAddress: rows[0].locationAddress || '',
        pincode: rows[0].pincode || '',
        preferredCrops: rows[0].preferredCrops || '',
        utara_file_path: rows[0].utara_file_path || '',
        land_image_path: rows[0].land_image_path || '',
        farmCreatedAt: rows[0].farmCreatedAt || new Date().toISOString()
      };

      return sendResponse(res, 200, farmerData, 'Farmer profile retrieved successfully');
    })
    .catch((err) => {
      console.error('Error fetching farmer profile:', err);
      console.error('SQL Error details:', {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        sql: query,
        params: [farmerId]
      });
      return sendResponse(res, 500, null, 'Server error while fetching farmer profile');
    });
});

// Route to update farmer profile
server.put('/farmer/profile/:farmerId', (req, res) => {
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

  promisePool.execute(updateUserSql, [fullName, contact, farmerId])
    .then(() => {
      promisePool.execute(updateFarmSql, [soilType, preferredCrops, locationAddress, pincode, farmerId])
        .then(() => {
          res.status(200).json({ message: 'Profile updated successfully' });
        })
        .catch((err) => {
          console.error('Error updating farm details:', err);
          return res.status(500).json({ message: 'Farm details update failed', error: err });
        });
    })
    .catch((err) => {
      console.error('Error updating user:', err);
      return res.status(500).json({ message: 'User update failed', error: err });
    });
});

// Route to delete farmer account
server.delete('/farmer/profile/:farmerId', (req, res) => {
  const { farmerId } = req.params;

  // First, delete the associated farm details
  const deleteFarmDetailsQuery = 'DELETE FROM farm_details WHERE userId = ?';
  promisePool.execute(deleteFarmDetailsQuery, [farmerId])
    .then(([results]) => {
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Farmer not found' });
      }

      // Then delete the user
      const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
      return promisePool.execute(deleteUserQuery, [farmerId])
        .then(([userResults]) => {
          if (userResults.affectedRows === 0) {
            return res.status(404).json({ message: 'Farmer not found' });
          }

          res.status(200).json({ message: 'Farmer account and related farm details deleted successfully' });
        })
        .catch((err) => {
          console.error('Error deleting user:', err);
          return res.status(500).json({ message: 'Server error while deleting user' });
        });
    })
    .catch((err) => {
      console.error('Error deleting farm details:', err);
      return res.status(500).json({ message: 'Server error while deleting farm details' });
    });
});

// Route to fetch contractor profile
server.get('/contractor/profile/:contractorId', (req, res) => {
  const { contractorId } = req.params;
  const query = 'SELECT * FROM users WHERE id = ? AND userType = "Contractor"';

  promisePool.execute(query, [contractorId])
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Contractor not found' });
      }
      res.status(200).json(rows[0]);
    })
    .catch((err) => {
      console.error('Error fetching contractor profile:', err);
      return res.status(500).json({ message: 'Server error' });
    });
});

// Route to update contractor profile
server.put('/contractor/profile/:contractorId', (req, res) => {
  const { contractorId } = req.params;
  const { fullName, contact } = req.body;

  const updateQuery = `
    UPDATE users 
    SET fullName = ?, contact = ? 
    WHERE id = ? AND userType = "Contractor"
  `;

  promisePool.execute(updateQuery, [fullName, contact, contractorId])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Contractor not found or no changes made' });
      }
      return res.status(200).json({ message: 'Contractor profile updated successfully' });
    })
    .catch((err) => {
      console.error('Error updating contractor:', err);
      return res.status(500).json({ message: 'Update failed' });
    });
});

// Route to delete contractor profile
server.delete('/contractor/profile/:contractorId', (req, res) => {
  const contractorId = req.params.contractorId;

  promisePool.execute('DELETE FROM users WHERE id = ? AND userType = "Contractor"', [contractorId])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Contractor not found' });
      }
      res.status(200).json({ message: 'Contractor account deleted successfully' });
    })
    .catch((err) => {
      console.error('Error deleting contractor:', err);
      return res.status(500).json({ message: 'Failed to delete account' });
    });
});

// Send SMS Message API
server.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return sendResponse(res, 400, null, 'Phone number and message are required');
  }

  try {
    const smsResponse = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to:7276821427
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

  console.log('\n=== New Message Request ===');
  console.log('Contractor:', contractorName);
  console.log('Contractor ID:', contractorId);
  console.log('Farmer ID:', farmerId);
  console.log('Message:', message);

  if (!farmerId || !message || !contractorName || !contractorId) {
    console.log('❌ Error: Missing required fields');
    return sendResponse(res, 400, null, 'All fields are required');
  }

  try {
    // Verify contractor exists and is of type Contractor
    const contractorQuery = 'SELECT * FROM users WHERE id = ? AND userType = "Contractor"';
    const [contractorResults] = await promisePool.execute(contractorQuery, [contractorId]);

    if (contractorResults.length === 0) {
      console.log('❌ Error: Invalid contractor or unauthorized access');
      return sendResponse(res, 403, null, 'Invalid contractor or unauthorized access');
    }

    console.log('✅ Contractor verified successfully');

    // Get farmer's contact number
    const farmerQuery = 'SELECT contact FROM users WHERE id = ? AND userType = "Farmer"';
    const [farmerResults] = await promisePool.execute(farmerQuery, [farmerId]);

    if (farmerResults.length === 0) {
      console.log('❌ Error: Farmer not found');
      return sendResponse(res, 404, null, 'Farmer not found');
    }

    const farmerContact = farmerResults[0].contact;
    console.log('✅ Farmer contact found:', farmerContact);
    
    // Format phone number for Twilio (add +91 for Indian numbers)
    const formattedNumber = farmerContact.startsWith('+') 
      ? farmerContact 
      : `+91${farmerContact}`;

    console.log('📱 Formatted phone number:', formattedNumber);

    try {
      console.log('📤 Sending SMS via Twilio...');
      const smsResponse = await twilio.messages.create({
        body: `[AgroSync] New Interest from ${contractorName} (Contractor ID: ${contractorId}):\n${message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedNumber
      });

      console.log('✅ SMS sent successfully!');
      console.log('�� Message SID:', smsResponse.sid);
      console.log('=== End of Message Request ===\n');
      return sendResponse(res, 200, { sid: smsResponse.sid }, 'Message sent successfully');
    } catch (smsError) {
      console.error('❌ Error sending SMS:', smsError);
      return sendResponse(res, 500, null, 'Failed to send message. Please check the phone number format.');
    }
  } catch (error) {
    console.error('❌ Error in send-farmer-message:', error);
    return sendResponse(res, 500, null, 'Internal server error');
  }
});

// Get all farms for a specific farmer
server.get('/:farmerId', (req, res) => {
  const farmerId = req.params.farmerId;
  const query = 'SELECT * FROM farm_details WHERE userId = ?';
  promisePool.execute(query, [farmerId])
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    })
    .catch((err) => {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    });
});

// Add a new farm
server.post('/add', (req, res) => {
  const {
    userId,
    soilType,
    waterSource,
    landArea,
    locationAddress,
    pincode,
    preferredCrops,
  } = req.body;

  const farm_id = uuidv4().slice(0, 20);

  const query = `
    INSERT INTO farm_details 
    (farm_id, userId, soilType, waterSource, landArea, locationAddress, pincode, preferredCrops)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    farm_id,
    userId,
    soilType,
    waterSource,
    landArea,
    locationAddress,
    pincode,
    preferredCrops,
  ];

  console.log("Incoming request body:", req.body);
  console.log("Values to insert:", values);

  promisePool.execute(query, values)
    .then(([result]) => {
      if (result.affectedRows > 0) {
        res.json({ message: 'Farm added successfully' });
      } else {
        res.status(500).json({ error: 'Failed to add farm' });
      }
    })
    .catch((err) => {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Failed to add farm' });
    });
});

// Edit farm
server.put('/:id', (req, res) => {
  const farmId = req.params.id;
  const {
    soilType,
    waterSource,
    landArea,
    locationAddress,
    pincode,
    preferredCrops,
  } = req.body;

  const query = `
    UPDATE farm_details 
    SET soilType = ?, waterSource = ?, landArea = ?, locationAddress = ?, pincode = ?, preferredCrops = ?
    WHERE id = ?
  `;
  const values = [
    soilType,
    waterSource,
    landArea,
    locationAddress,
    pincode,
    preferredCrops,
    farmId,
  ];

  promisePool.execute(query, values)
    .then(([result]) => {
      if (result.affectedRows > 0) {
        res.json({ message: 'Farm updated successfully' });
      } else {
        res.status(500).json({ error: 'Failed to update farm' });
      }
    })
    .catch((err) => {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Failed to update farm' });
    });
});

// Delete farm
server.delete('/:id', (req, res) => {
  const farmId = req.params.id;
  const query = 'DELETE FROM farm_details WHERE id = ?';
  promisePool.execute(query, [farmId])
    .then(([result]) => {
      if (result.affectedRows > 0) {
        res.json({ message: 'Farm deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete farm' });
      }
    })
    .catch((err) => {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Failed to delete farm' });
    });
});

// POST /agreements - Create a new agreement proposal
server.post('/agreements',(async (req, res) => {
    console.log('Received agreement request body:', req.body);
    
    let { farmId, farmerId, contractorId, contract_details, amount, terms, start_date, end_date, contractor_signature,
      agreement_type, profit_share, sale_price, payment_method, crop_type, penalty_clause, renewal_option } = req.body;

    // Stringify terms if it's an array
    if (Array.isArray(terms)) {
      terms = JSON.stringify(terms);
    }

    console.log('Parsed request data:', {
        farmId,
        farmerId,
        contractorId,
        contract_details,
        amount,
        terms,
        start_date,
        end_date,
        hasContractorSignature: !!contractor_signature,
        agreement_type,
        profit_share,
        sale_price,
        payment_method,
        crop_type,
        penalty_clause,
        renewal_option
    });

    // Validate incoming data
    if (!farmId || !farmerId || !contractorId || !amount || !terms || !start_date || !end_date || 
        (agreement_type !== 'Land Selling' && !contract_details)) {
        console.log('Validation failed. Missing fields:', {
            farmId: !farmId,
            farmerId: !farmerId,
            contractorId: !contractorId,
            contract_details: !contract_details,
            amount: !amount,
            terms: !terms,
            start_date: !start_date,
            end_date: !end_date,
            agreement_type: agreement_type
        });
        return res.status(400).json({ 
            status: false, 
            message: 'Missing required fields.',
            details: {
                farmId: !farmId,
                farmerId: !farmerId,
                contractorId: !contractorId,
                contract_details: !contract_details,
                amount: !amount,
                terms: !terms,
                start_date: !start_date,
                end_date: !end_date,
                agreement_type: agreement_type
            }
        });
    }

    // Validate dates
    if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({
            status: false,
            message: 'End date must be after start date.'
        });
    }

    // Validate that the farmer exists
    try {
        console.log('Validating farmer ID:', farmerId);
        const [farmerResult] = await promisePool.execute('SELECT id FROM users WHERE id = ? AND userType = "Farmer"', [farmerId]);
        console.log('Farmer validation result:', farmerResult);
        if (farmerResult.length === 0) {
            return res.status(400).json({ 
                status: false, 
                message: 'Invalid farmer ID. Farmer not found.' 
            });
        }
    } catch (err) {
        console.error('Error validating farmer:', err);
        return res.status(500).json({ 
            status: false, 
            message: 'Error validating farmer details.',
            error: err.message
        });
    }

    // Validate that the contractor exists
    try {
        console.log('Validating contractor ID:', contractorId);
        const [contractorResult] = await promisePool.execute('SELECT id FROM users WHERE id = ? AND userType = "Contractor"', [contractorId]);
        console.log('Contractor validation result:', contractorResult);
        if (contractorResult.length === 0) {
            return res.status(400).json({ 
                status: false, 
                message: 'Invalid contractor ID. Contractor not found.' 
            });
        }
    } catch (err) {
        console.error('Error validating contractor:', err);
        return res.status(500).json({ 
            status: false, 
            message: 'Error validating contractor details.',
            error: err.message
        });
    }

    const insertSql = `
        INSERT INTO agreements (
            farmId, 
            farmerId, 
            contractorId, 
            contract_details, 
            amount, 
            terms, 
            start_date, 
            end_date, 
            status,
            contractor_signature,
            agreement_type,
            profit_share,
            sale_price,
            payment_method,
            crop_type,
            penalty_clause,
            renewal_option
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        farmId,
        farmerId,
        contractorId,
        contract_details,
        amount,
        terms,
        start_date,
        end_date,
        contractor_signature || null,
        agreement_type || null,
        profit_share || null,
        sale_price || null,
        payment_method || null,
        crop_type || null,
        penalty_clause || null,
        renewal_option || null
    ];

    console.log('Executing SQL:', insertSql);
    console.log('With values:', values);

    try {
        console.log('Attempting to insert agreement...');
        const [result] = await promisePool.execute(insertSql, values);
        console.log('Insert result:', result);
        
        if (result.affectedRows > 0) {
            const createdAgreementId = result.insertId;
            console.log('Agreement created successfully with ID:', createdAgreementId);
            // Fetch farmer contact
            try {
                const [farmerRows] = await promisePool.execute('SELECT contact FROM users WHERE id = ? AND userType = "Farmer"', [farmerId]);
                if (farmerRows.length > 0) {
                    let farmerContact = farmerRows[0].contact;
                    let formattedNumber = formatIndianNumber(farmerContact);
                    if (!formattedNumber) {
                        console.error('Invalid farmer phone number for SMS:', farmerContact);
                    } else {
                        try {
                            await twilio.messages.create({
                                body: 'You have received a new agreement on your profile.',
                                from: process.env.TWILIO_PHONE_NUMBER,
                                to: formattedNumber
                            });
                            console.log('SMS sent to farmer:', formattedNumber);
                        } catch (smsErr) {
                            console.error('Error sending SMS to farmer:', smsErr);
                            if (smsErr && smsErr.code) {
                                console.error('Twilio Error Code:', smsErr.code);
                                console.error('Twilio Error Message:', smsErr.message);
                                console.error('Twilio More Info:', smsErr.moreInfo);
                            }
                        }
                    }
                }
            } catch (fetchErr) {
                console.error('Error fetching farmer contact for SMS:', fetchErr);
            }
            return res.status(201).json({ 
                status: true, 
                agreementId: createdAgreementId, 
                message: 'Agreement proposed successfully.' 
            });
        } else {
            console.error('No rows affected during insert');
            return res.status(500).json({ 
                status: false, 
                message: 'Failed to create agreement record.' 
            });
        }
    } catch (err) {
        console.error("Error creating agreement:", err);
        console.error("SQL Error details:", {
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage,
            sql: insertSql,
            values: values
        });
        return res.status(500).json({ 
            status: false, 
            message: 'Database error while creating agreement.',
            details: err.message
        });
    }
}));

// GET /agreements/user/:userId - Get agreements for a specific user
server.get('/agreements/user/:userId', (async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ status: false, message: 'User ID is required.' });
    }

    const query = `
        SELECT
            a.*,
            f.fullName AS farmerName,
            f.contact AS farmerContact,
            c.fullName AS contractorName
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
}));

// PUT /agreements/:agreementId/status - Update agreement status (Accept/Reject)
server.put('/agreements/:agreementId/status', async (req, res) => {
    const { agreementId } = req.params;
    const { status, userId, signature } = req.body;

    console.log('Received update request:', { agreementId, status, userId, hasSignature: !!signature });

    // Input validation
    if (!agreementId || !status || !userId) {
        console.error('Missing required fields:', { agreementId, status, userId });
        return res.status(400).json({ 
            status: false, 
            message: 'Agreement ID, status, and user ID are required.' 
        });
    }

    const validStatuses = ['Accepted', 'Rejected'];
    if (!validStatuses.includes(status)) {
        console.error('Invalid status provided:', status);
        return res.status(400).json({ 
            status: false, 
            message: 'Invalid status provided. Must be "Accepted" or "Rejected".' 
        });
    }

    const findAgreementSql = 'SELECT * FROM agreements WHERE agreementId = ?';

    try {
        // Find the agreement
        const [findResults] = await promisePool.execute(findAgreementSql, [agreementId]);
        console.log('Found agreement:', findResults[0]);

        if (findResults.length === 0) {
            console.error('Agreement not found:', agreementId);
            return res.status(404).json({ 
                status: false, 
                message: 'Agreement not found.' 
            });
        }

        const agreement = findResults[0];

        if (agreement.status !== 'Pending') {
            console.error('Agreement already processed:', agreement.status);
            return res.status(400).json({ 
                status: false, 
                message: `Agreement already ${agreement.status.toLowerCase()}.` 
            });
        }

        // Only the farmer can accept or reject
        if (Number(agreement.farmerId) !== Number(userId)) {
            console.error('Unauthorized user attempt:', { 
                requesterId: userId, 
                farmerId: agreement.farmerId 
            });
            return res.status(403).json({ 
                status: false, 
                message: 'Only the farmer can accept or reject the agreement.' 
            });
        }

        // Prepare update query
        let updateSql, updateValues;
        
        if (status === 'Accepted' && signature) {
            updateSql = 'UPDATE agreements SET status = ?, farmer_signature = ?, updated_at = NOW() WHERE agreementId = ?';
            updateValues = [status, signature, agreementId];
        } else {
            updateSql = 'UPDATE agreements SET status = ?, updated_at = NOW() WHERE agreementId = ?';
            updateValues = [status, agreementId];
        }

        console.log('Executing update query:', { updateSql, updateValues });
        const [updateResult] = await promisePool.execute(updateSql, updateValues);
        console.log('Update result:', updateResult);

        if (updateResult.affectedRows > 0) {
            // If the agreement is accepted, update the farm status to 'in_use'
            if (status === 'Accepted') {
                try {
                    await promisePool.execute(
                        'UPDATE farm_details SET status = ? WHERE farm_id = ?',
                        ['in_use', agreement.farmId]
                    );
                    console.log(`Updated farm ${agreement.farmId} status to 'in_use'`);
                } catch (farmUpdateErr) {
                    console.error('Error updating farm status:', farmUpdateErr);
                    // Continue execution even if farm status update fails
                }
            }

            // Fetch contractor contact
            try {
                const [contractorRows] = await promisePool.execute(
                    'SELECT contact FROM users WHERE id = ? AND userType = "Contractor"', 
                    [agreement.contractorId]
                );
                
                if (contractorRows.length > 0) {
                    let contractorContact = contractorRows[0].contact;
                    console.log('Raw contractor contact:', contractorContact);
                    
                    let formattedContractorNumber = formatIndianNumber(contractorContact);
                    console.log('Formatted contractor number:', formattedContractorNumber);
                    
                    if (!formattedContractorNumber) {
                        console.error('Invalid contractor phone number for SMS:', contractorContact);
                    } else {
                        let statusMsg = status === 'Accepted' 
                            ? 'Your agreement has been accepted. The farm is now marked as in use.' 
                            : 'Your agreement has been rejected.';
                        
                        try {
                            const message = await twilio.messages.create({
                                body: statusMsg,
                                from: process.env.TWILIO_PHONE_NUMBER,
                                to: formattedContractorNumber
                            });
                            console.log('SMS sent successfully:', {
                                to: formattedContractorNumber,
                                messageId: message.sid,
                                status: message.status
                            });
                        } catch (smsErr) {
                            console.error('Twilio SMS Error:', {
                                code: smsErr.code,
                                message: smsErr.message,
                                moreInfo: smsErr.moreInfo,
                                status: smsErr.status,
                                to: formattedContractorNumber
                            });
                        }
                    }
                } else {
                    console.error('Contractor not found for ID:', agreement.contractorId);
                }
            } catch (fetchErr) {
                console.error('Error in SMS sending process:', fetchErr);
            }
            return res.status(200).json({
                status: true,
                agreementId: agreementId,
                newStatus: status,
                message: `Agreement ${status.toLowerCase()} successfully.`
            });
        } else {
            return res.status(500).json({ status: false, message: 'Failed to update agreement status.' });
        }

    } catch (error) {
        console.error('[ERROR] Error in agreement status update:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sql: error.sql,
            sqlMessage: error.sqlMessage,
            stack: error.stack
        });
        
        return res.status(500).json({ 
            status: false, 
            message: 'An error occurred while updating the agreement status.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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
    // Fetch only users with userType 'Contractor'
    const [rows] = await promisePool.execute('SELECT * FROM users WHERE userType = "Contractor"');
    
    // Transform the data to match frontend expectations
    const contractors = rows.map(contractor => ({
      id: contractor.id,
      name: contractor.fullName, // Assuming fullName is the name you want to display
      contact: contractor.contact,
      image: contractor.image || 'https://via.placeholder.com/150' // Default image if none provided
    }));

    res.json(contractors);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contractors data',
      message: error.message 
    });
  }
});

// GET /farms - Get all farms with their agreement status
server.get('/farms', async (req, res) => {
  try {
    // Get all farms including their agreement status
    const [farms] = await promisePool.execute(`
      SELECT f.*, 
             CASE 
               WHEN a.status = 'Accepted' THEN 'in_use' 
               ELSE f.status 
             END as display_status
      FROM farms f
      LEFT JOIN agreements a ON f.farmId = a.farmId AND a.status = 'Accepted'
      WHERE f.status = 'available'
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
        console.error('Empty phone number provided');
        return null;
    }
    
    // Remove all non-digit characters
    let cleaned = String(raw).replace(/[^0-9]/g, '');
    console.log('Cleaned phone number:', cleaned);
    
    // Handle various formats
    if (cleaned.length === 10) {
        // Standard 10-digit number
        return `+91${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
        // Number starting with 0
        return `+91${cleaned.slice(1)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        // Number starting with 91
        return `+${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
        // Number starting with 91 and extra digit
        return `+${cleaned}`;
    }
    
    console.error('Invalid phone number format:', raw, 'cleaned:', cleaned);
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
    
    res.json({
      status: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching farms with active agreements:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch farms with active agreements',
      error: error.message
    });
  }
});

// Start Server
server.listen(8055, () => {
  console.log('Server is listening on port 8055...');
  console.log('Connected to database')
});










