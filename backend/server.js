const express = require('express');
const cors = require('cors');
require('dotenv').config(); // <-- TAMBAHKAN BARIS INI
const path = require('path');
const app = express();

const routes = require('./routes');

app.use(cors());
app.use(express.json());

// Serve static files dari root folder
app.use(express.static(path.join(__dirname, '..')));

app.use('/api', routes);

app.listen(5000, () => {
    console.log('Backend Jalan di Port 5000...');
});