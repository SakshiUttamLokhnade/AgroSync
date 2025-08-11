


const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const bcryptjs = require("bcryptjs");

const server = express();

// Middleware
// server.use(cors());

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
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

// MySQL Connection
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sakshi@123',
  database: 'agrosync',
  port: '3306'
});

con.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database!');
  }
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
      VALUES (?, ?, ?, ?, ?, ?)`;

    con.query(insertUserSql, userValues, (err, result) => {
      if (err) {
        return res.json({ status: false, message: 'User Insert Error: ' + err.message });
      }

      const userId = result.insertId;

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

        con.query(insertFarmSql, farmValues, (err2) => {
          if (err2) {
            return res.json({ status: false, message: 'Farm Details Insert Error: ' + err2.message });
          }

          return res.json({ status: true, message: 'Farmer registered successfully!' });
        });
      } else {
        return res.json({ status: true, message: 'User registered successfully!' });
      }
    });
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
  con.query(sql, [userName], async (error, results) => {
    if (error) {
      return res.json({ status: false, message: `Error: ${error.message}` });

    }

    if (results.length === 0) {
      return res.json({ status: false, message: 'Invalid username or password.' });
    }

    const user = results[0];
    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      return res.json({ status: false, message: 'Invalid username or password.' });
    }

    res.json({
      status: true,
      message: 'Login successful!',
      userType: user.userType,
      farmerId:user.id,
      user: user
    });
  });
});

// Get All Farmers API
server.get('/get-farmers', (req, res) => {
  const sql = `
    SELECT u.fullName, f.locationAddress, f.landArea,
           f.preferredCrops, f.land_image_path
    FROM users u
    JOIN farm_details f ON u.id = f.userId
    WHERE u.userType = 'Farmer'`;

  con.query(sql, (err, result) => {
    if (err) {
      return res.json({ status: false, message: 'Error fetching farmers', error: err });
    }

    return res.json({ status: true, data: result });
  });
});

// Forgot Password API
server.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const query = 'SELECT * FROM users WHERE userName = ?'; // assuming email = userName

  con.query(query, [email], (err, results) => {
    if (err) {
      console.error('DB ERROR:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Simulate sending email (actual email sending logic can be added later)
    return res.status(200).json({ message: 'Reset link sent to your email (simulated)' });
  });
});



// Route to fetch farmer profile
server.get('/farmer/profile/:farmerId', (req, res) => {
  const { farmerId } = req.params;
  const query = 'SELECT * FROM users WHERE id = ?';
  con.query(query, [farmerId], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    res.status(200).json(results[0]);
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

  con.query(updateUserSql, [fullName, contact, farmerId], (err, userResult) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ message: 'User update failed', error: err });
    }

    con.query(updateFarmSql, [soilType, preferredCrops, locationAddress, pincode, farmerId], (err2, farmResult) => {
      if (err2) {
        console.error('Error updating farm details:', err2);
        return res.status(500).json({ message: 'Farm details update failed', error: err2 });
      }

      res.status(200).json({ message: 'Profile updated successfully' });
    });
  });
});

// Route to delete farmer account
server.delete('/farmer/profile/:farmerId', (req, res) => {
  const { farmerId } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';

  con.query(query, [farmerId], (err, results) => {
    if (err) {
      console.error('Error deleting account:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    res.status(200).json({ message: 'Account deleted successfully' });
  });
});


// Start Server
server.listen(8055, () => {
  console.log('Server is listening on port 8055...');
});
