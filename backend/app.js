const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const jobRoutes = require('./routes/jobs');
const recruiterRoutes = require('./routes/recruiter');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');


const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));

app.use('/jobs', jobRoutes);
app.use('/recruiter', recruiterRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);


module.exports = app;
