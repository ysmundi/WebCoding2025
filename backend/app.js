const express = require('express');
const cors = require('cors');
const jobRoutes = require('./routes/jobs');


const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));

app.use('/job', jobRoutes);


module.exports = app;
