const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const jobRoutes = require('./routes/jobs');
const recruiterRoutes = require('./routes/recruiter');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const path = require('path');


const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));

app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/recruiter', express.static(path.join(__dirname, '../recruiter')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/lib', express.static(path.join(__dirname, '../lib')));
app.use('/jobs', jobRoutes);
app.use('/recruiter', recruiterRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

app.get('/recruiter/post-job', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/posting-jobs-form.html'));
});

app.get('/positions', (req, res) => {
    res.sendFile(path.join(__dirname, '../student/student-positions.html'));
});

app.get('recruiter/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../student/student-positions.html'));
});

app.get('/student/apply', (req, res) => {
    res.sendFile(path.join(__dirname, '../student/student-appicationpage.html'));
});

// app.get('/jobs', (req, res) => {
//     res.sendFile(path.join(__dirname, '../student/student-positions.html'));
// }); 

// app.get('/jobs', (req, res) => {
//     res.sendFile(path.join(__dirname, '../student/student-positions.html'));
// });

// app.get('/jobs', (req, res) => {
//     res.sendFile(path.join(__dirname, '../student/student-positions.html'));
// });

// app.get('/jobs', (req, res) => {
//     res.sendFile(path.join(__dirname, '../student/student-positions.html'));
// });

// app.get('/jobs', (req, res) => {
//     res.sendFile(path.join(__dirname, '../student/student-positions.html'));
// });

// app.get('/jobs', (req, res) => {
//     res.sendFile(path.join(__dirname, '../student/student-positions.html'));
// });

// app.get('/jobs', (req, res) => {
//     res.sendFile(path.join(__dirname, '../student/student-positions.html'));
// });


module.exports = app;
