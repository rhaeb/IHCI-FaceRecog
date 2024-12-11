const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const userRoute = require('./src/routes/userRoute'); // Import user routes

dotenv.config();
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

// Routes
app.use('/api/users', userRoute);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
