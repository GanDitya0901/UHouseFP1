const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors'); 
const path = require('path');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


const fs = require ('fs');
const multer = require('multer');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:4200' }));

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ratihsuarningsih24@gmail.com',
    pass: 'ztnx dqxu gosc fbwq' // Use the App Password generated if 2FA is enabled
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    // Generate a unique filename for each uploaded file
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//connection to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/user')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));


//User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String },
  phone: { type: String },
  address: {type: String},
  password: { type: String },
  role: { type: String,  type: String,
    enum: ['admin', 'guest'],
    default: 'guest' },
  date: { type: Date, default: Date.now },
  language: { type: String },
  country: { type: String },
  gender: { type: String },
  dateOfBirth: { type: Date },
  fullname: { type: String },
  profilePhoto: { type: String }, // URL or path to the profile photo

});

// Facility Schema
const facilitySchema = new mongoose.Schema({
  parking: Boolean,
  swimmingPool: Boolean,
  airConditioner: Boolean,
  balcony: Boolean,
  towel: Boolean,
  bathAmenities: Boolean,
  sunBed: Boolean,
  outdoorShower: Boolean
});

// Schema for RoomManage
const RoomManageSchema = new mongoose.Schema({
  roomImg: String,
  roomType: String,
  roomNum: Number,
  roomPolicy: String,
  roomDesc: String,
  roomBathroom: String,
  roomFloor: Number,
  bedType: String,
  numBeds: Number,
  facilitySchema: facilitySchema,
});



// Define Mongoose Model 
const RoomManage = mongoose.model('RoomManage', RoomManageSchema);
const User = mongoose.model('User', UserSchema);

// JWT Secret Key
const JWT_SECRET = 'jwtToken'; 

//for admin default credential
const createDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = new User({
        username: 'admin',
        email: adminEmail,
        phone: '0000000000',
        password: hashedPassword,
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Default admin created');
    } else {
      console.log('Admin already exists');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

createDefaultAdmin();


//signUp
app.post('/signup', (req, res) => {
  const { username, email, phone, password } = req.body;
  console.log('Received user data:', req.body);

  User.findOne({ email })
    .then(user => {
      if (user) {
        return res.status(400).json({ message: 'This email is already registered' });
      } else {
        const newUser = new User({
          username,
          email,
          phone,
          password,
          role: 'guest'
        });

        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to generate salt' });
          }
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
              return res.status(500).json({ message: 'Failed to hash password' });
            }
            newUser.password = hash;
            console.log('Saving user data:', newUser);
            newUser
              .save()
              .then(savedUser => {
                console.log('User saved successfully:', savedUser);
                const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, JWT_SECRET);
                console.log('JWT token:', token); // Log the token
                res.json({ user: savedUser, token });
              })
              .catch(err => {
                console.log('Error saving user:', err);
                return res.status(500).json({ message: 'Failed to save user' });
              });
          });
        });
      }
    })
    .catch(err => {
      console.log('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    });
});

app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  User.findOne({ email })
    .then(user => {
      if (!user) {
        console.error('No user with that email address');
        return res.status(404).json({ message: 'No user with that email address' });
      }

      const token = crypto.randomBytes(20).toString('hex');

      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      user.save().then(updatedUser => {
        const mailOptions = {
          to: user.email,
          from: 'password-reset@yourapp.com',
          subject: 'Password Reset',
          text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                 Please click on the following link, or paste this into your browser to complete the process:\n\n
                 http://localhost:4200/reset-password/${token}\n\n
                 If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        transporter.sendMail(mailOptions, (err) => {
          if (err) {
            console.error('Error sending email:', err);
            return res.status(500).json({ message: 'Error sending email' });
          }
          res.json({ message: 'Password reset email sent' });
        });
      }).catch(err => {
        console.error('Error saving user:', err);
        res.status(500).json({ message: 'Error saving user' });
      });
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ message: 'Database error' });
    });
});



app.post('/reset-password/:token', (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
    .then(user => {
      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
      }

      bcrypt.genSalt(10, (err, salt) => {
        if (err) return res.status(500).json({ message: 'Failed to generate salt' });

        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if (err) return res.status(500).json({ message: 'Failed to hash password' });

          user.password = hash;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save().then(() => {
            res.json({ message: 'Password reset successful' });
          }).catch(err => res.status(500).json({ message: 'Error saving new password' }));
        });
      });
    })
    .catch(err => res.status(500).json({ message: 'Database error' }));
});

//signIn
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json({ email: 'User not found' });
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to compare passwords' });
        }
        if (!result) {
          return res.status(401).json({ password: 'Incorrect password' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log('JWT token:', token);

        let redirectUrl = '/manage-profile';
        if (user.role === 'admin') {
          redirectUrl = '/crudRoom';
        }

        res.json({ message: 'Login successful', role: user.role, token, redirectUrl });
      });
    })
    .catch(err => {
      console.log('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    });
});


// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).send('Token is required');

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(403).send('Token is required');

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Invalid token');
    req.user = decoded;
    next();
  });
};

//users role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireGuest = (req, res, next) => {
  if (req.user.role !== 'guest') {
    return res.status(403).json({ message: 'Guest access required' });
  }
  next();
};

app.get('/admin', verifyToken, requireAdmin, (req, res) => {
  res.send('Welcome to the admin page');
});

app.get('/guest', verifyToken, requireGuest, (req, res) => {
  res.send('Welcome to the guest page');
});

//manage profile
app.post('/uploads', upload.single('profilePhoto'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send({ filename: req.file.filename });
});


app.post('/user/profile-photo', upload.single('profilePhoto'), (req, res) => {
  const profilePhotoPath = req.file.path;
  const userId = req.user.id; // Assuming req.user is set after token verification

  User.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.profilePhoto = profilePhotoPath;
      user.save()
        .then(updatedUser => res.json(updatedUser))
        .catch(err => res.status(500).json({ error: 'Error saving user data' }));
    })
    .catch(err => res.status(500).json({ error: 'Database error' }));
});

app.get('/user/profile', verifyToken, (req, res) => {
  User.findById(req.user.id)
    .then(user => {
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    })
    .catch(err => res.status(500).json({ error: 'Error fetching user data' }));
});

app.put('/user/profile', verifyToken, upload.single('profilePhoto'), (req, res) => {
  const { fullname, username, email, phone, dateOfBirth, gender, country, language, address } = req.body;

  User.findById(req.user.id)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('File:', req.file); // Check if the file is received
      console.log('Body:', req.body); // Check the request body

      // Update fields only if they are provided in the request body
      if (fullname !== undefined) user.fullname = fullname;
      if (username !== undefined) user.username = username;
      if (address !== undefined) user.address = address;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (gender !== undefined) user.gender = gender;
      if (country !== undefined) user.country = country;
      if (language !== undefined) user.language = language;
      if (req.file) user.profilePhoto = req.file.path;

      console.log('Updated user:', user);

      user.save()
        .then(updatedUser => res.json(updatedUser))
        .catch(err => {
          console.error('Error saving user:', err);
          res.status(500).json({ error: 'Error updating user data' });
        });
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
    });
});
//update password
app.post('/user/change-password', verifyToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  User.findById(req.user.id).then(user => {
    if (!user) return res.status(404).json({ message: 'User not found' });

    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Error comparing passwords' });
      if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

      bcrypt.genSalt(10, (err, salt) => {
        if (err) return res.status(500).json({ error: 'Error generating salt' });

        bcrypt.hash(newPassword, salt, (err, hash) => {
          if (err) return res.status(500).json({ error: 'Error hashing new password' });

          user.password = hash;
          user.save().then(updatedUser => {
            res.json({ message: 'Password updated successfully' });
          }).catch(err => res.status(500).json({ error: 'Error saving new password' }));
        });
      });
    });
  }).catch(err => res.status(500).json({ error: 'Database error' }));
});


// Endpoint to handle file upload for room
app.post('/roommanages', upload.single('roomImg'), verifyToken, async (req, res) => {
  try {
    const { roomType, roomNum, roomPrice, roomDesc, roomBathroom, roomFloor,bedType,numBeds, facilities } = req.body;

    // Validate required fields
    if (!roomType || !roomNum || !roomPrice || !roomDesc || !roomBathroom || !roomFloor||!bedType||!numBeds) {
      console.error('Missing required fields:', { roomType, roomNum, roomPolicy, roomDesc, roomBathroom, roomFloor, bedType,numBeds });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const roomNumber = Number(roomNum);
    const roomFloorNumber = Number(roomFloor);
    const roomCost = Number(roomPrice);
    const roomImage = req.file ? req.file.path : ''; 
    const newRoom = new RoomManage({
      roomImg: roomImage, 
      roomType,
      roomNum: roomNumber,
      roomPrice: roomCost,
      roomDesc,
      roomBathroom,
      roomFloor: roomFloorNumber,
      bedType,
      numBeds,
      facilities: facilities || []
    });

    console.log('newRoom', newRoom)

    await newRoom.save();
    res.status(200).json({ message: 'Room added successfully' });
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to fetch all rooms
app.get('/roommanages', verifyToken, async (req, res) => {
  try {
    const rooms = await RoomManage.find();
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/roommanages/:id', verifyToken, async (req, res) => {
  try {
    const room = await RoomManage.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/roommanages/:id', verifyToken, upload.single('roomImg'), async (req, res) => {
  try {
    const roomId = req.params.id;
    const updatedData = { ...req.body };

    if (req.file) {
      updatedData.roomImg = req.file.path;
    }

    if (updatedData.roomNum) updatedData.roomNum = Number(updatedData.roomNum);
    if (updatedData.roomFloor) updatedData.roomFloor = Number(updatedData.roomFloor);

    const updatedRoom = await RoomManage.findByIdAndUpdate(roomId, updatedData, { new: true });

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.delete('/roommanages/:id', verifyToken, async (req, res) => {
  try {
    const roomId = req.params.id;
    await RoomManage.findByIdAndDelete(roomId);
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});











  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
