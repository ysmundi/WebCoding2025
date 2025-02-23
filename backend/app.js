const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const jobRoutes = require('./routes/jobs');
const recruiterRoutes = require('./routes/recruiter');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const path = require('path');


const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
 }));

app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/recruiter', express.static(path.join(__dirname, '../recruiter')));
app.use('/student', express.static(path.join(__dirname, '../student')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/lib', express.static(path.join(__dirname, '../lib')));
app.use('/home', express.static(path.join(__dirname, '../home')));
app.use('/login', express.static(path.join(__dirname, '../login')));
app.use('/', express.static(path.join(__dirname, '../')));
app.use('/jobs', jobRoutes);
app.use('/recruiter', recruiterRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);

//Open recruiter's pages 

//backedn connected 
app.get('/recruiter/post-job', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/posting-jobs-form.html'));
});

//need to connect backend 
app.get('/recruiter/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/home-recruiter.html'));
});

//need to connect backend 
app.get('/recruiter/project-info', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/recruiter-projectinfo.html'));
});

app.get('/recruiter/subscriptions', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/recruiter-subscriptions.html'));
});

//need to connect backend 
app.get('/recruiter/student-application', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/recruiter-viewstudentapplication.html'));
});

app.get('/recruiter/job-postings', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/recruiter-jobpostings.html'));
});

app.get('/recruiter/subscriptions', (req, res) => {
    res.sendFile(path.join(__dirname, '../recruiter/recruiter-subscriptions.html'));
});

//Open student's pages 

app.get('/student/application', (req, res) => {
    res.sendFile(path.join(__dirname, '../student/student-appicationpage.html'));
});

app.get('/student/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../student/student-home.html'));
});

app.get('/student/positions', (req, res) => {
    res.sendFile(path.join(__dirname, '../student/student-positions.html'));
}); 

app.get('/student/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../student/student-yourprofile.html'));
});

//Open admin's pages 

app.get('/admin/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../home/home-admin.html'));
});

app.get('/admin/recruiter-postings', (req, res) => {
    res.sendFile(path.join(__dirname, '../home/view-recruiters-postinigs.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../login/login-1.html'));
});

 


module.exports = app;
