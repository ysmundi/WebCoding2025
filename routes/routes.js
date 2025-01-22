// routes/routes.js
const mysql = require('mysql');
const bodyParser = require('body-parser');
const serverConfig = require('../config/serverConfig');
const fs = require("fs");
const fsextra = require('fs-extra');
const request = require("request");
const bcrypt = require('bcrypt-nodejs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const async = require('async');
const crypto = require('crypto');
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");
const multiparty = require('multiparty');
const path    = require('path');
// const ExpressBrute = require('express-brute');
const rateLimit = require("express-rate-limit");
const text = require('textbelt');
const generator = require('generate-password');
// const transporter = nodemailer.createTransport(serverConfig.mail);
const Influx = require('influx');
const influx = new Influx.InfluxDB(serverConfig.influx);
const con = mysql.createConnection(serverConfig.mysql);
var stations = [];
var station;
var DeEmail = serverConfig.email;
var FlagN = [];
var PairN = [];
var EQstations;

// const store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
// const bruteforce = new ExpressBrute(store);

const con_CS = mysql.createConnection(serverConfig.commondb_connection);
const smtpTrans = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'aaaa.zhao@g.northernacademy.org',
        pass: "qwer1234"
    }
});

const Limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
});

let exec = require('child_process').exec;
let myStat, myVal, myErrMsg, token, mylogin;
let today, date2, date3, time2, time3, dateTime, tokenExpire;

con_CS.query('USE ' + serverConfig.Login_db); // Locate Login DB

module.exports = function (app, passport) {

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(cors({
        origin: '*',
        credentials: true
    }));

    // app.use(Limiter);

    // =====================================
    // CS APP Home Section =================
    // =====================================

    app.get('/', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        res.render('homepage.ejs', {
            message: req.flash('loginMessage'),
            error: "Your username and password don't match."
        })
    });
};
