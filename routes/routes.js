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

    app.get('/',function (req,res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        res.render('homepage.ejs', {
            message: req.flash('loginMessage'),
            error: "Your username and password don't match."
        })
    });

    app.get('/homepageLI', isLoggedIn, function (req, res) {
        let myStat = "Select userrole From UserLogin WHERE username = ? ;";
        let state = "SELECT firstName FROM UserProfile WHERE username = ? ;";
        con_CS.query(myStat + state, [req.user.username, req.user.username], (err, results) => {
            if (!results[0][0].userrole) {
                console.log("User Role is missing!");
            } else if (!results[1][0].firstName) {
                console.log("First Name is missing!")
            } else {
                res.render('homepageUSER.ejs', {
                    user: req.user, // get the user out of session and pass to template
                    firstName: results[1][0].firstName
                });
            }
        });
    });

    con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'", function (err, result) {
        EQstations = result;
        // console.log(result)

        for (let i = 0; i < result.length; i++) {
            FlagN.push([{stationInfo: result[i]}, [], []]);
            PairN.push([{stationInfo: result[i]}, [], []]);
            if (i === result.length - 1) {
                EventCheck(result, FlagN, PairN, DeEmail);
            }
        }
    });

    // app.get('/currentLayer',function (req,res) {
    //     res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
    //     let thirdlayer = req.query.thirdlayer;
    //     let queryState = 'SELECT FirstLayer, SecondLayer, ThirdLayer, Longitude, Latitude, Altitude FROM LayerMenu WHERE ThirdLayer = ?';
    //     con_CS.query(queryState, thirdlayer, function (err, results) {
    //         if (err) {
    //             console.log(err);
    //             res.json({"error": true, "message": "An unexpected error occurred !"});
    //         } else {
    //             res.json(results);
    //         }
    //     });
    // });
    //
    // app.get('/firstLayer', function (req, res) {
    //     res.setHeader("Access-Control-Allow-Origin", "*");
    //     con_CS.query("SELECT FirstLayer FROM LayerMenu WHERE Status ='Approved' GROUP BY FirstLayer ", function (err, result) {
    //         if (err) { throw err } else {
    //             res.json(result);
    //         }
    //     });
    // });
    //
    // app.get('/secondLayer', function (req, res) {
    //     res.setHeader("Access-Control-Allow-Origin", "*");
    //     let firstlayerValue = req.query.FirstLayer;
    //     con_CS.query("SELECT SecondLayer,FirstLayer FROM LayerMenu WHERE Status ='Approved' and FirstLayer =? GROUP BY SecondLayer", firstlayerValue ,function (err, result) {
    //         if (err) { throw err } else {
    //             res.json(result);
    //         }
    //     });
    //
    // });
    //
    // app.get('/thirdLayer', function (req, res) {
    //     res.setHeader("Access-Control-Allow-Origin", "*");
    //     let secondLayerValue = req.query.SecondLayer;
    //     con_CS.query("SELECT LayerType,SecondLayer,ThirdLayer,CityName,StateName,CountryName, GROUP_CONCAT(LayerName) as LayerName FROM LayerMenu WHERE Status ='Approved' and SecondLayer =? GROUP BY ThirdLayer,CityName,StateName,CountryName,SecondLayer,LayerType", secondLayerValue ,function (err, result) {
    //         if (err) { throw err } else {
    //             res.json(result);
    //         }
    //     });
    // });

    // =====================================
    // LOGIN Section =======================
    // =====================================
    // show the login form
    /*app.get('/login', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {
            message: req.flash('loginMessage'),
            error: "Your username and password don't match."
        })
    });*/
    app.get('/login', function (req, res) {
        res.sendFile(path.join(__dirname, 'login', 'login-1.html'));
    });
    /*app.get('/historical', isLoggedIn, function (req, res) {
        res.render('historical.ejs', {});
    });

    // app.get('/historical', function (req, res) {
    //     // render the page and pass in any flash data if it exists
    //     res.render('historical.ejs', {});
    // });

    app.get('/anomalytable', isLoggedIn, function (req, res) {
        res.render('AnomalyTable.ejs', {});
    });

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
    app.use(bodyParser.json());


    app.get('/stations', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        // console.log("hi there")
        con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where Status = 'Active'", function (err, result) {
            if (err) console.log(err);
            // console.log(result);
            res.send(result);
        });
    });

    app.get('/table', function (req, res) {
        con.query("SELECT * FROM ESP2.AnomalyTable", function (err, result1) {
            if (err) throw err;
            res.send(result1);
        });

    });
    app.get('/true', function (req, res) {
        con.query("UPDATE ESP2.AnomalyTable SET TruePositive='T' WHERE link='" + req.query.link + "'", function (err, result1) {
            if (err) throw err;
            res.send('result1');
        });

    });

    app.get('/submit', async function (req, res) {
        // timeFromt = req.query.timeFrom + 'T00:00:00Z';
        timeTot = req.query.timeTo;
        stations=req.query.stations;
        stationPASS=req.query.stationPASS;
        la=req.query.la;
        lo=req.query.lo;


        // Split timestamp into [ Y, M, D, h, m, s ]
        var t = timeTot.split(/[- :]/);
        // console.log(t)

// Apply each element to the Date function
        //you change the days you want to get here
        var timeFromt = new Date(Date.UTC(t[0], t[1]-1, t[2].split("T")[0]-serverConfig.day, t[2].split("T")[1],t[3], "00"));
        var tF = timeFromt.toISOString()
//     var timeFromt=timeTot.getTime()
//     console.log(timeFromt)

// -> Wed Jun 09 2010 14:12:01 GMT+0100 (BST)

        var results=[]
        if(typeof stations !== "undefined"){

            var str = 'SELECT * FROM ESP2.AnomalyTable WHERE BeginningTime>"' + tF + '" AND EndingTime<"' + timeTot + '" AND Degrees<90 AND Station1 in ('+[stations]+') AND Station2 in ('+[stations]+')';
            // console.log(str)
            await con.query(str, async function (err, result) {
                if (err) throw err;
                // console.log(result.length);

                // console.log(result)


                var results=[]
                // function findStation1(element,item){
                //     if(element.StationName===item.Station1){
                //         return true;
                //     }
                // }
                await result.forEach(checking)
                function checking(item, index) {
                    var a=0;
                    for(a=0;a<stationPASS.length;a++){
                        if(stationPASS[a].StationName===item.Station1){
                            var station1Info=stationPASS[a];
                            // console.log("hellothere")
                            // console.log(station1Info)
                        }
                        if(stationPASS[a].StationName===item.Station2){
                            var station2Info=stationPASS[a];
                            // console.log(station2Info)
                        }
                        if(typeof station1Info!=="undefined" && typeof station2Info!=="undefined"){
                            if (( getDegree(item.Degree1,la, lo, station1Info.Latitude, station1Info.Longitude))
                                * (getDegree(item.Degree2,la, lo,  station2Info.Latitude, station2Info.Longitude)) < 0) {
                                // console.log("pass")
                                results.push(item)
                            }
                        }
                    }

                }
                res.send(results);
                // console.log(results)
                // console.log('sent')
                // res.end();

            });

        }else{
            res.send([])
        }
    });

    app.get('/stationsForN', function (req, res) { //stations information used for new event page
        res.setHeader("Access-Control-Allow-Origin", "*");
        var stationId = req.query.stationID;
        // console.log("station Id")
        // console.log(stationId);
        con.query("SELECT State FROM ESP2.stationdata Where StationId ='" + stationId + "';", function (err, result1) {
            // console.log("result")
            // console.log(result1)
            if (err) {
                throw err;
            } else {
                con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'", function (err, result) {
                    if (err) throw err;
                    res.send(result);
                });
            }
        });
    });

//this is part that responsible for the check the event (in historical page) where you can select specific time period.
    app.get('/newMoon', function (req, res) { //stations information used for new event page
        var timeFrom = req.query.timeFrom;
        var timeTo = req.query.timeTo;
        var email = req.query.email;
        var FLAGH = []
        var PAIRH = []
        // console.log("These are new things")
        // console.log(timeFrom, timeTo);
        moon(timeFrom, timeTo, FLAGH, PAIRH, email)
        res.send("event success")
    });


    var DeEmail = serverConfig.email;
    var EQstations;
    var FlagN = [];
    var PairN = [];

    function degrees(x, y) {
        // console.log("x direction(which is our y) " + y, "y direction(which is our x) " + x)
        if (x > 0 && y > 0) {
            degree = Math.atan(x / y) * (180 / Math.PI)
            // console.log("1"+degree)
        } else if (y < 0 && x > 0) {
            degree = Math.atan(x / y) * (180 / Math.PI) + 180
            // console.log("2"+degree)
        } else if (y < 0 && x < 0) {
            degree = Math.atan(x / y) * (180 / Math.PI) + 180
            // degree = degree-360;
            // console.log("3"+degree)
        } else {
            degree = Math.atan(x / y) * (180 / Math.PI)
            degree=360+degree
            // console.log("4"+degree)
        }
        // if (degree<0){
        //     degree=360+degree
        //     console.log(degree)
        //     return degree
        // }else{
        //     console.log(degree)
        return degree
        // }
    }


    app.get('/newEjs', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        // console.log("Receive A Demo request: ");
        // console.log(req.query.timeFrom,req.query.timeTo,req.query.stationName,req.query.stationId)
        res.render('../views/new.ejs', {
            timeFrom: req.query.timeFrom,
            timeTo: req.query.timeTo,
            stationName: req.query.stationName,
            stationId: req.query.stationId,
            city: req.query.city,
            state: req.query.state,
            la: req.query.la,
            lo: req.query.lo,
            timeFrom2: req.query.timeFrom2,
            timeTo2: req.query.timeTo2,
            stationName2: req.query.stationName2,
            stationId2: req.query.stationId2,
            city2: req.query.city2,
            state2: req.query.state2,
            la2: req.query.la2,
            lo2: req.query.lo2,
            bdx: req.query.bdx,
            bdy: req.query.bdy,
            bdx2: req.query.bdx2,
            bdy2: req.query.bdy2
        })
    });

    app.get('/newWind', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        // console.log("Time FROM")
        // console.log(req.query.stationIs,req.query.timeFrom,req.query.timeTo)
        let queryHa = 'SELECT * FROM ' + req.query.stationIs + 'avg WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
        influx.query(queryHa).then
        (result => {
            // console.log("got it")
            res.send(result);
        }).catch(err => {
            res.status(500).send(err.stack)
        });
    });

    app.get('/newSnow', async function (req, res) {
        try {
            res.setHeader("Access-Control-Allow-Origin", "*");
            let queryH = 'SELECT * FROM ' + req.query.stationIs + ' WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
            // console.log(queryH);
            let download = [];
            influx.query(queryH).then
            (result => {
                result.forEach(function (el, i) {
                    let a = '' + el.X;
                    let b = '' + el.Y;
                    let c = '' + el.Z;
                    let t = el.time;
                    // download += t + ',' + a + ',' + b + ',' + c + '\n';
                    download.push({time: t, x: a, y: b, z: c});
                })
            }).catch(err => {
                res.status(500).send(err.stack)
            });
        } catch (err) {
            console.log(err)
        }

        let exportFilename = req.query.stationName + "_" + req.query.timeFrom.slice(5, -11) + '-' + req.query.timeTo.slice(5, -11) + 'Raw.csv';
        let link = './rawData/' + exportFilename;
        const csvWriter = createCsvWriter({
            path: link,
            header: [
                {id: 'time', title: 'Time'},
                {id: 'x', title: 'X'},
                {id: 'y', title: 'Y'},
                {id: 'z', title: 'Z'},
            ]
        });
        await csvWriter
            .writeRecords(download)
            .then(() => {
                res.send(link);
            });
    });

    app.get('/query', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        let chartDuration = req.query.chartDuration;
        let query = 'SELECT * FROM ' + req.query.stationID + 'avg WHERE time >= now() - ' + chartDuration + ' AND time<=now()';
        influx.query(query).then
        (result => {
            res.send(result);
        }).catch(err => {
            console.log(err)
        })
    });












*/
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/authentication', // redirect to the secure profile section
            failureRedirect: '/login', // redirect to the login page if there is an error
            failureFlash: true // allow flash messages
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
                req.session.cookie.expires = false;
            }
            res.redirect('/login');
        },);

/*
    // //Detects if user is admin
    app.get('/authentication', function (req, res) {
        dateNtime();

        res.render('2step.ejs',{
            user:req.user,
            username: req.user.username
        });
    });

    // Update user login status
    app.get('/loginUpdate', isLoggedIn, function (req, res) {
        dateNtime();

        myStat = "UPDATE UserLogin SET status = 'Active', lastLoginTime = ? WHERE username = ?";
        myVal = [dateTime, req.user.username];
        myErrMsg = "Please try to login again";
        updateDBNredir(myStat, myVal, myErrMsg, "login.ejs", "/userhome", res);
    });

    app.get('/forgot', function (req, res) {
        res.render('forgotPassword.ejs', {message: req.flash('forgotPassMessage')});

    });

    app.post('/email', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        let statement = "SELECT * FROM UserLogin WHERE username = '" + req.body.username + "';";

        con_CS.query(statement, function (err, results, fields) {
            if (err) {
                console.log(err);
                res.json({"error": true, "message": "An unexpected error occurred !"});
            } else if (results.length === 0) {
                res.json({"error": true, "message": "Please verify your email address !"});
            } else {
                let username = req.body.username;
                let subject = "Password Reset";
                let text = 'the reset of the password for your account.';
                let url = "http://" + req.headers.host + "/reset/";
                sendToken(username, subject, text, url, res);
            }
        });
    });
////////////////////////////////!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    app.post('/eauth', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        let statement = "SELECT * FROM UserLogin WHERE username = '" + req.user.username + "';";

        let password = generator.generateMultiple(1, {
            length: 8,
            uppercase: true,
            excludeSimilarCharacters: true,
            numbers: true,
            symbols:false
        });

        password = password.toString().toUpperCase();

        con_CS.query(statement, function (err, results, fields) {
            if (err) {
                console.log(err);
                res.json({"error": true, "message": "An unexpected error occurred !"});
            } else if (results.length === 0) {
                res.json({"error": true, "message": "Please verify your email address !"});
            } else {
                res.render('EmailAuth.ejs', {
                    user: req.user,
                    Code: password
                });
                let username = req.user.username;
                let subject = "Email Authentication for CitySmart";
                let text = 'an email authentication for logging in your admin account.';
                let url = ""+ password +"";
                // console.log(url);
                sendToken3(username, subject, text, url, res);
            }
        });
    });

    app.post('/kauth', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header

        myStat = "SELECT question1, question2, answer1, answer2 FROM UserLogin WHERE username = '" + req.user.username + "'";

        con_CS.query(myStat, function (err, result) {
            // console.log("Here is the result:");
            // console.log(result);
            // console.log(result[0].question1);

            if (err) {
                res.send('An unexpected error occurred.');
            } else {
                res.render('KnowledgeAuth.ejs', {
                    user: req.user,
                    question1: result[0].question1,
                    question2: result[0].question2,
                    answer1: result[0].answer1,
                    answer2: result[0].answer2

                });
            }
        });

    });

    app.post('/pauth', function (req, res) {
        let phoneNumber;
        res.setHeader("Access-Control-Allow-Origin", "*");

        myStat = "SELECT Phone_Number FROM UserProfile WHERE username = '" + req.user.username + "'";

        con_CS.query(myStat, function (err, result) {
            // console.log("Here is the result:");
            // console.log(result);
            // console.log(result[0].Phone_Number);

            if(result[0].Phone_Number === "" || result[0].Phone_Number === "null" || result[0].Phone_Number === "NULL") {
                phoneNumber = "NULL";
            } else {
                phoneNumber = result[0].Phone_Number;
            }

            res.render('PhoneAuthP1.ejs', {
                user: req.user,
                Phone_Number: phoneNumber,

            });

        });

    });

    app.post('/pcode', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");

        let result = Object.keys(req.body).map(function (key) {
            return [String(key)];
        });


        // console.log('The code was successfully generated');
        // console.log(result[0]);

        let password = generator.generateMultiple(1, {
            length: 8,
            uppercase: true,
            excludeSimilarCharacters: true,
            numbers: true,
            symbols: false,
        });

        password = password.toString().toUpperCase();

        // console.log('password');
        // console.log(password);
        // console.log(req.user.Phone_Number);

        text.sendText(result[0], " Your verification code:   " + password + "   will be valid for 3 minutes. Please enter the code into the provided field.", undefined, function(err) {
            if (err) {
                console.log(err);
                res.send("An error has occurred.");
            } else{
                res.render('PhoneAuthP2.ejs', {
                    user: req.user,
                    Code: password,
                    Phone_Number: req.body.Phone_Number
                });
            }
        });

    });

    app.get('/emailRequest', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        let requester = req.query.requester;
        // console.log("Email request initiated");
        // console.log(requester);

        let statement = "SELECT username FROM UserLogin WHERE userrole = 'Admin';";

        con_CS.query(statement, function (err, results, fields) {
            if (err) {
                console.log(statement + "ERROR");
                console.log(err);
                res.json({"error": true, "message": "An unexpected error occurred !"});
            } else if (results.length === 0) {
                console.log(statement);
                res.json({"error": true, "message": "Please verify your email address !"});
            } else {
                // console.log(requester);
                let username = 'julial.zhu@g.feitianacademy.org';
                let subject = "New User Request By " + requester;
                let text = 'requested to publish a new layer.';
                let url = "http://" + req.headers.host + "/userhome/";
                sendToken2(username, subject, text, url, res);
            }
        });
    });

    app.get('/reset/:token', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header

        myStat = "SELECT * FROM UserLogin WHERE resetPasswordToken = '" + req.params.token + "'";

        con_CS.query(myStat, function (err, user) {
            dateNtime();

            if (!user || dateTime > user[0].resetPasswordExpires) {
                res.send('Password reset token is invalid or has expired. Please contact Administrator.');
            } else {
                res.render('reset.ejs', {
                    user: user[0]
                });
            }
        });
    });

    app.post('/reset/:token', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header

        async.waterfall([
            function (done) {

                myStat = "SELECT * FROM UserLogin WHERE resetPasswordToken = '" + req.params.token + "'";

                con_CS.query(myStat, function (err, user) {
                    let userInfo = JSON.stringify(user, null, "\t");

                    if (!user) {
                        res.json({"error": true, 'message': 'Password reset token is invalid or has expired. Please contact Administrator.'});
                    } else {
                        let newPass = {
                            Newpassword: bcrypt.hashSync(req.body.NewPassword, null, null),
                            confirmPassword: bcrypt.hashSync(req.body.Confirmpassword, null, null)
                        };

                        let passReset = "UPDATE UserLogin SET password = '" + newPass.Newpassword + "' WHERE resetPasswordToken = '" + req.params.token + "'";
                        con_CS.query(passReset, function (err, rows) {
                            if (err) {
                                console.log(err);
                                res.json({"error": true, "message": "New Password Insert Fail!"});
                            } else {
                                let username = req.body.username;
                                let subject = "Your password has been changed";
                                let text = 'Hello,\n\n' + 'This is a confirmation that the password for your account, ' + changeMail(username) + ' has just been changed.\n';
                                done(err, username, subject, text);
                            }
                        });
                    }

                });
            }, function (user, done, err) {

                let message = {
                    from: 'FTAA <aaaa.zhao@g.northernacademy.org>',
                    to: req.body.username,
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' +
                        'This is a confirmation that the password for your account, ' + changeMail(req.body.username) + ' has just been changed.\n'
                };

                smtpTrans.sendMail(message, function (error) {
                    if (error) {
                        console.log(error.message);
                        // alert('Something went wrong! Please double check if your email is valid.');
                        return;
                    } else {
                        res.redirect('/login');
                    }
                });
            }
        ]);
    });

    //show the signout form
    app.get('/signout', function (req, res) {
        req.session.destroy();
        req.logout();
        res.redirect('/');
    });

    // =====================================
    // USER Home Section ===================
    // =====================================

    app.get('/userhome', isLoggedIn, function (req, res) {
        let myStat = "SELECT userrole FROM UserLogin WHERE username = '" + req.user.username + "';";
        let state2 = "SELECT firstName, lastName FROM UserProfile WHERE username = '" + req.user.username + "';"; //define last name

        con_CS.query(myStat + state2, function (err, results) {
            // console.log("Users: ");
            // console.log(results);

            if (err) throw err;

            if (!results[0][0].userrole) {
                console.log("Error2");
            } else if (!results[1][0].firstName) {
                console.log("Error1")
            } else {
                // console.log("Yes");
                // console.log(req.user);
                res.render('userHome.ejs', {
                    user: req.user, // get the user out of session and pass to template
                    firstName: results[1][0].firstName,
                    lastName: results[1][0].lastName,
                });
            }
        });
    });

    // =====================================
    // REQUEST QUERY   =====================
    // =====================================


    // =====================================
    // USER PROFILE  =======================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)

    // Show user profile page
    app.get('/profile', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        let userN = req.query.userN;
        con_CS.query("SELECT * FROM UserProfile WHERE username = '" + userN + "'; SELECT question1, answer1, question2, answer2 FROM UserLogin WHERE username = '" + userN + "';", function (err, results) {
            if (err) throw err;
            res.json(results);
        })
    });

    app.post('/checkpassword',function (req,res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        let password = req.body.pass;
        let statement = "SELECT password FROM UserLogin WHERE username = '" + req.body.username + "';";
        // console.log(password);
        // console.log(statement);
        // console.log(req.body.username);
        con_CS.query(statement,function (err,results) {
            res.json((!bcrypt.compareSync(password, results[0].password)));
        });
    });

    app.get('/userProfile', isLoggedIn, function (req, res) {
        res.render('userProfile.ejs', {
            user: req.user,
        });
        // console.log(req.user);
    });

    app.post('/userProfile', isLoggedIn, function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header

        // new password (User Login)
        let user = req.user;
        let newPass = {
            currentpassword: req.body.CurrentPassword,
            Newpassword: bcrypt.hashSync(req.body.NewPassword, null, null),
            confirmPassword: bcrypt.hashSync(req.body.ConfirmNewPassword, null, null)
        };

        let passComp = bcrypt.compareSync(newPass.currentpassword, user.password);

        if (!!req.body.NewPassword && passComp) {
            let passReset = "UPDATE UserLogin SET password = '" + newPass.Newpassword + "' WHERE username = '" + user.username + "'";

            con_CS.query(passReset, function (err, rows) {
                if (err) {
                    console.log(err);
                    res.json({"error": true, "message": "Fail !"});
                } else {
                    // res.json({"error": false, "message": "Success !"});
                    basicInformation();
                }
            });
        } else {
            basicInformation();
        }

        // User Profile
        function basicInformation() {
            let result = Object.keys(req.body).map(function (key) {
                return [String(key), req.body[key]];
            });

            let update1 = "UPDATE UserProfile SET ";
            let update2 = "";
            let update3 = " WHERE username = '" + req.user.username + "';";
            let update4 = "UPDATE UserLogin SET ";
            let update5 = "";
            let update6 = " WHERE username = '" + req.user.username + "';";
            for (let i = 1; i < result.length - 7; i++) {
                if (i === result.length - 8) {
                    update2 += result[i][0] + " = '" + result[i][1] + "'";
                } else {
                    update2 += result[i][0] + " = '" + result[i][1] + "', ";
                }
            }
            for (let i = result.length - 7; i < result.length - 3; i++) {
                if (i === result.length - 4) {
                    update5 += result[i][0] + " = '" + result[i][1] + "'";
                } else {
                    update5 += result[i][0] + " = '" + result[i][1] + "', ";
                }
            }
            let statement1 = update1 + update2 + update3 + update4 + update5 + update6;

            con_CS.query(statement1, function (err, result) {
                if (err) {

                    res.json({"error": true, "message": "Fail !"});
                } else {
                    // res.json({"error": false, "message": "Success !"});
                    let oldname = req.user.username;
                    let newname = req.body.username;

                    if (newname !== oldname) {
                        let statement = "UPDATE UserLogin SET PendingUsername = '"+ newname + "' WHERE username = '" + oldname + "';";
                        con_CS.query(statement, function (err,result) {
                            if (err) {
                                console.log(err);
                                res.json({"error": true, "message": "An unexpected error occurred !"});
                            } else if (result.length === 0) {
                                res.json({"error": true, "message": "Please verify your email address !"});
                            } else {
                                let username = newname;
                                let subject = "Email verify";
                                let text = 'to verify the new username(email).';
                                let url = "http://" + req.headers.host + "/verifyemail/";
                                sendname(username, subject, text, url, res);
                            }
                        });
                    } else {
                        res.json({"error": false, "message": "Success !"});
                    }
                }
            });
        }
    });

    // Update user profile page
    app.post('/newPass', isLoggedIn, function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        let user = req.user;
        let newPass = {
            // firstname: req.body.usernameF,
            // lastname: req.body.usernameL,
            currentpassword: req.body.CurrentPassword,
            Newpassword: bcrypt.hashSync(req.body.NewPassword, null, null),
            confirmPassword: bcrypt.hashSync(req.body.ConfirmNewPassword, null, null)
        };

        let passComp = bcrypt.compareSync(newPass.currentpassword, user.password);

        if (!!req.body.NewPassword && passComp) {
            let passReset = "UPDATE UserLogin SET password = '" + newPass.Newpassword + "' WHERE username = '" + user.username + "'";

            con_CS.query(passReset, function (err, rows) {
                if (err) {
                    console.log(err);
                    res.json({"error": true, "message": "Fail !"});
                } else {
                    res.json({"error": false, "message": "Success !"});
                }
            });
        }
    });


    // =====================================
    // USER MANAGEMENT =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)

    // Show user management bak page
    app.get('/userManagement', isLoggedIn, function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");

        myStat = "SELECT userrole FROM UserLogin WHERE username = '" + req.user.username + "';";
        let state2 = "SELECT firstName FROM UserProfile WHERE username = '" + req.user.username + "';";

        con_CS.query(myStat + state2, function (err, results, fields) {

            if (!results[0][0].userrole) {
                console.log("Error2");
            } else if (!results[1][0].firstName) {
                console.log("Error1")
            } else if (results[0][0].userrole === "Admin" || "Regular") {
                // process the signup form
                res.render('userManagement.ejs', {
                    user: req.user, // get the user out of session and pass to template
                    firstName: results[1][0].firstName
                });
            }
        });
    });

    // show the signup form
    app.get('/signup', function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', {
            message: req.flash('signupMessage')
        });
    });

    app.post('/signup', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        // con_CS.query('USE ' + serverConfig.Login_db); // Locate Login DB

        let newUser = {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: bcrypt.hashSync(req.body.password, null, null),  // use the generateHash function
            userrole: req.body.userrole,
            phoneNumber: req.body.phoneNumber,
            question1: req.body.question1,
            question2: req.body.question2,
            answer1: req.body.answer1,
            answer2: req.body.answer2,
            dateCreated: req.body.dateCreated,
            createdUser: req.body.createdUser,
            dateModified: req.body.dateCreated,
            status: req.body.status
        };

        myStat = "INSERT INTO UserLogin ( username, password, userrole, question1, question2, answer1, answer2, dateCreated, dateModified, createdUser, status) VALUES ( '" + newUser.username + "','" + newUser.password+ "','" + newUser.userrole+ "','" + newUser.question1+ "','" + newUser.question2+ "','" + newUser.answer1+ "','" + newUser.answer2+ "','" + newUser.dateCreated+ "','" + newUser.dateModified+ "','" + newUser.createdUser + "','" + newUser.status + "');";
        mylogin = "INSERT INTO UserProfile ( username, firstName, lastName, Phone_Number) VALUES ('"+ newUser.username + "','" + newUser.firstName+ "','" + newUser.lastName + "','" + newUser.phoneNumber + "');";
        // console.log("mystat");
        // console.log(myStat);
        // console.log(mylogin);
        con_CS.query(myStat + '' + mylogin, function (err, rows) {
            // newUser.id = rows.insertId;
            if (err) {
                console.log(err);
                res.json({"error": true, "message": "An unexpected error occurred!"});
            } else {
                let username = req.body.username;
                let subject = "Sign Up";
                let text = 'to sign up an account with this email.';
                let url = "http://" + req.headers.host + "/verify/";
                sendToken(username, subject, text, url, res);
                res.redirect('/login');
                // res.render('login.ejs', {
                //     message: req.flash('loginMessage'),
                //     error: "Your username and password don't match."
                // });
            }
        });
    });

    // show the addUser form
    app.get('/addUser', isLoggedIn, function (req, res) {
        // render the page and pass in any flash data if it exists
        res.render('adduser.ejs', {
            user: req.user,
            message: req.flash('addUserMessage')
        });
    });

    app.post('/addUser', isLoggedIn, function (req, res) {

        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        // connection.query('USE ' + serverConfig.Login_db); // Locate Login DB

        let newUser = {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: bcrypt.hashSync(req.body.password, null, null),  // use the generateHash function
            userrole: req.body.userrole,
            dateCreated: req.body.dateCreated,
            createdUser: req.body.createdUser,
            dateModified: req.body.dateCreated,
            status: req.body.status
        };

        myStat = "INSERT INTO UserLogin ( username, password, userrole, dateCreated, dateModified, createdUser, status) VALUES ( '" + newUser.username + "','" + newUser.password+ "','" + newUser.userrole+ "','" + newUser.dateCreated+ "','" + newUser.dateModified+ "','" + newUser.createdUser + "','" + newUser.status + "');";
        mylogin = "INSERT INTO UserProfile ( username, firstName, lastName) VALUES ('"+ newUser.username + "','" + newUser.firstName+ "','" + newUser.lastName + "');";
        con_CS.query(myStat + mylogin, function (err, rows) {
            //newUser.id = rows.insertId;
            if (err) {
                console.log(err);
                res.json({"error": true, "message": "An unexpected error occurred !"});
            } else {
                res.json("Success! Please return to the previous page.");
                // res.redirect('../views/userManagement.ejs')
            }
        });
    });

    app.get('/verify/:token', function(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        async.waterfall([
            function(done) {
                myStat = "SELECT * FROM UserLogin WHERE resetPasswordToken = '" + req.params.token + "'";
                con_CS.query(myStat, function(err, results) {
                    dateNtime();

                    if (results.length === 0 || dateTime > results[0].expires) {
                        res.send('Password reset token is invalid or has expired. Please contact Administrator.');
                    } else {
                        done(err, results[0].username);
                    }
                });
            }, function(username, done) {
                myStat = "UPDATE UserLogin SET status = 'Never Logged In' WHERE username = '" + username + "';";

                con_CS.query(myStat, function(err, user) {
                    if (err) {
                        console.log(err);
                        res.send("An unexpected error occurred !");
                    } else {
                        let subject = "Account Activated";
                        let text = 'Hello,\n\n' + 'This is a confirmation for your account, ' + changeMail(username) + ' has just been activated.\n';
                        done(err, username, subject, text);
                    }

                });
            }, function(username, subject, text) {
                successMail(username, subject, text, res);
            }
        ]);
    });

    app.get('/verifyemail/:token', function(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        async.waterfall([
            function(done) {
                myStat = "SELECT * FROM UserLogin WHERE resetPasswordToken = '" + req.params.token + "'";
                con_CS.query(myStat, function(err, results) {
                    dateNtime();
                    if (results.length === 0 || dateTime > results[0].expires) {
                        res.send('Password reset token is invalid or has expired. Please contact Administrator.');
                    } else {
                        done(err, results[0].PendingUsername);
                    }
                });
            }, function(PendingUsername, done) {
                myStat = "UPDATE UserLogin SET username = '"+ PendingUsername  + "', PendingUsername = '' WHERE PendingUsername = '"+ PendingUsername + "';";
                // mylogin = "UPDATE UserLogin SET PendingUsername = '' WHERE PendingUsername = '" + PendingUsername + "';";
                let myProfile = "UPDATE UserProfile SET username = '" + PendingUsername + "' WHERE username = '" + req.user.username + "';";
                con_CS.query(myStat + myProfile, function(err, user) {
                    if (err) {
                        console.log(err);
                        res.send("An unexpected error occurred !");
                    } else {
                        let subject = "Account Activated";
                        let text = 'Hello,\n\n' + 'This is a confirmation for your account, ' + changeMail(PendingUsername) + ' has just been activated.\n';
                        done(err, PendingUsername, subject, text);
                    }

                });
            }, function(username, subject, text) {
                successMail(username, subject, text, res);
            }
        ]);
    });

    // Filter by search criteria
    app.get('/filterUser', isLoggedIn, function (req, res) {
        // res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header

        myStat = "SELECT UserProfile.*, UserLogin.* FROM UserLogin INNER JOIN UserProfile ON UserLogin.username = UserProfile.username";

        let myQuery = [
            {
                fieldVal: req.query.dateCreatedFrom,
                dbCol: "dateCreated",
                op: " >= '",
                adj: req.query.dateCreatedFrom
            },
            {
                fieldVal: req.query.dateCreatedTo,
                dbCol: "dateCreated",
                op: " <= '",
                adj: req.query.dateCreatedTo
            },
            {
                fieldVal: req.query.dateModifiedFrom,
                dbCol: "dateModified",
                op: " >= '",
                adj: req.query.dateModifiedFrom
            },
            {
                fieldVal: req.query.dateModifiedTo,
                dbCol: "dateModified",
                op: " <= '",
                adj: req.query.dateModifiedTo
            },
            {
                fieldVal: req.query.userrole,
                dbCol: "userrole",
                op: " = '",
                adj: req.query.userrole
            },
            {
                fieldVal: req.query.firstName,
                dbCol: "firstName",
                op: " = '",
                adj: req.query.firstName
            },
            {
                fieldVal: req.query.lastName,
                dbCol: "lastName",
                op: " = '",
                adj: req.query.lastName
            },
            {
                fieldVal: req.query.status,
                dbCol: "status",
                op: " = '",
                adj: req.query.status
            },
            {
                fieldVal: req.query.Phone_Number,
                dbCol: "Phone_Number",
                op: " = '",
                adj: req.query.Phone_Number
            }
        ];

        QueryStat(myQuery, myStat, res);
    });

    // // Retrieve user data from user management page
    let edit_User, edit_firstName, edit_lastName, edit_userrole, edit_status, edit_city;
    app.get('/editUserQuery', isLoggedIn, function (req, res) {

        edit_User = req.query.Username;
        edit_firstName = req.query.First_Name;
        edit_city = req.query.City;
        edit_lastName = req.query.Last_Name;
        edit_userrole = req.query.User_Role;
        edit_status = req.query.status;

        res.json({"error": false, "message": "/editUser"});
    });

    app.post('/edituserform',function (req,res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header

        // new password (User Login)
        let user = req.body.Username;
        //Converts array to string
        let editingUser = req.user.username;
        // let editingUserPassword = req.user.password;

        // basicInformation();

        // let user = req.user;
        let newPass = {
            // currentpassword: req.body.CurrentPassword,
            Newpassword: bcrypt.hashSync(req.body.NewPassword, null, null),
            confirmPassword: bcrypt.hashSync(req.body.ConfirmNewPassword, null, null)
        };

        // let passComp = bcrypt.compareSync(newPass.currentpassword, user.password);

        if (!!req.body.NewPassword) {
            let passReset = "UPDATE UserLogin SET password = '" + newPass.Newpassword + "' WHERE username = '" + user.username + "'";

            con_CS.query(passReset, function (err, rows) {
                if (err) {
                    console.log(err);
                    res.json({"error": true, "message": "Fail!"});
                } else {
                    // res.json({"error": false, "message": "Success !"});
                    basicInformation();
                }
            });
        } else {
            basicInformation();
        }

        // if(user === editingUser) {
        //     let newEditPass = {
        //         currentpassword: req.body.CurrentPassword,
        //         Newpassword: bcrypt.hashSync(req.body.NewPassword, null, null),
        //         confirmPassword: bcrypt.hashSync(req.body.ConfirmNewPassword, null, null)
        //     };
        //
        //
        //     let passComp = bcrypt.compareSync(newEditPass.currentpassword, editingUserPassword);
        //

        //
        //     // if (!!req.body.NewPassword) {
        //         let passAdminReset = "UPDATE UserLogin SET password = '" + newEditPass.Newpassword + "' WHERE username = '" + user + "'";
        //
        //         con_CS.query(passAdminReset, function (err, rows) {
        //             if (err) {
        //                 console.log(err);
        //                 res.json({"error": true, "message": "Fail !"});
        //             } else {
        //                 // res.json({"error": false, "message": "Success !"});
        //                 basicInformation();
        //             }
        //         });
        //     } else {
        //         basicInformation();
        //     }
        // } else {
        //     let newPass = {
        //         Newpassword: bcrypt.hashSync(req.body.NewPassword, null, null),
        //         confirmPassword: bcrypt.hashSync(req.body.ConfirmNewPassword, null, null)
        // };


        // if (!!req.body.NewPassword) {
        //     let passReset = "UPDATE UserLogin SET password = '" + newPass.Newpassword + "' WHERE username = '" + user + "'";
        //
        //     con_CS.query(passReset, function (err, rows) {
        //         if (err) {
        //             console.log(err);
        //             res.json({"error": true, "message": "Fail !"});
        //             res.json({"error": true, "message": err});
        //         } else {
        //             // res.json({"error": false, "message": "Success !"});
        //             basicInformation();
        //         }
        //     });
        // } else {
        //     basicInformation();
        // }
        // }

        function basicInformation() {
            let result = Object.keys(req.body).map(function (key) {
                return [String(key), req.body[key]];
            });
            // console.log(result);
            // let update3 = " WHERE username = '" + req.user.username + "'";
            let statement1 = "UPDATE UserLogin SET userrole = '" + result[3][1] + "',   status = '" + result[4][1] + "', dateModified = '" + result[5][1] + "', modifiedUser = '" + result[6][1] + "'  WHERE username = '" + result[0][1]+ "';";
            let statement2 = "UPDATE UserProfile SET firstName = '" + result[1][1] + "', lastName = '" + result[2][1] + "' WHERE username = '" + result[0][1] + "';";
            con_CS.query(statement1 + statement2, function (err, result) {
                if (err) throw err;
                res.json(result);
            });
        }
    });

    // Show user edit form
    app.get('/editUser', isLoggedIn, function (req, res) {

        res.render('userEdit.ejs', {
            user: req.user, // get the user out of session and pass to template
            username: req.body.username,
            // firstName: edit_firstName,
            // lastName: edit_lastName,
            // userrole: edit_userrole,
            // status: edit_status,
            message: req.flash('Data Entry Message')
        });
    });

    app.post('/editUser', isLoggedIn, function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header

        if (req.body.newPassword !== "") {
            let updatedUserPass = {
                firstName: req.body.First_Name,
                lastName: req.body.Last_Name,
                userrole: req.body.User_Role,
                status: req.body.Status,
                newPassword: bcrypt.hashSync(req.body.newPassword, null, null)
            };
            mylogin = "UPDATE UserProfile SET firstName = ?, lastName = ?";
            myStat = "UPDATE UserLogin SET password = ?, userrole = ?, status = ?, modifiedUser = '" + req.user.username + "', dateModified = '" + dateTime + "' WHERE username = ?";

            myVal = [updatedUserPass.firstName, updatedUserPass.lastName, updatedUserPass.newPassword, updatedUserPass.userrole, updatedUserPass.status, edit_User];
            updateDBNres(myStat + mylogin, myVal, "Update failed!", "/userManagement", res);
        } else {
            let updatedUser = {
                firstName: req.body.First_Name,
                lastName: req.body.Last_Name,
                userrole: req.body.User_Role,
                status: req.body.Status
            };
            mylogin = "UPDATE UserProfile SET firstName = ?, lastName = ?";
            myStat = "UPDATE UserLogin SET userrole = ?, status = ?, modifiedUser = '" + req.user.username + "', dateModified = '" + dateTime + "'  WHERE username = ?";

            myVal = [updatedUser.firstName, updatedUser.lastName, updatedUser.userrole, updatedUser.status, edit_User];
            updateDBNres(myStat + mylogin, myVal, "Update failed!", "/userManagement", res);
        }

    });

    app.get('/suspendUser', isLoggedIn, function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        dateNtime();

        let username = req.query.usernameStr.split(","); //they receive the username string from client side

        myStat = "UPDATE UserLogin SET modifiedUser = '" + req.user.username + "', dateModified = '" + dateTime + "',  status = 'Suspended'";

        for (let i = 0; i < username.length; i++) {
            if (i === 0) {
                myStat += " WHERE username = '" + username[i] + "'";
                if (i === username.length - 1) {
                    updateDBNres(myStat, "", "Suspension failed!", "/userManagement", res);
                }
            } else {
                myStat += " OR username = '" + username[i] + "'"; //is this assuming they don't try to suspend a faulty account more than twice?
                if (i === username.length - 1) {
                    updateDBNres(myStat, "", "Suspension failed!", "/userManagement", res);
                }
            }
        }
    });

    // =====================================
    // REQUEST FORM SECTION =================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)

    app.post('/submit', function (req, res) {
        let result = Object.keys(req.body).map(function (key) {
            return [String(key), req.body[key]];
        });
        res.setHeader("Access-Control-Allow-Origin", "*");

        let update1 = "UPDATE UserProfile SET ";
        let update2 = "";
        let update3 = " WHERE username = '" + req.user.username + "'";
        for (let i = 0; i < result.length - 3; i++) {
            if (i === result.length - 4) {
                update2 += result[i][0] + " = '" + result[i][1] + "'";
            } else {
                update2 += result[i][0] + " = '" + result[i][1] + "', ";
            }
        }
        let statement1 = update1 + update2 + update3;

        con_CS.query(statement1, function (err, result) {
            if (err) {
                throw err;
            } else {
                res.json("Connected!")
            }
        });
    });

    app.get('/SearchUsername', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        con_CS.query("SELECT username FROM ESP2.UserLogin", function (err, results) {
            if (err) throw err;
            res.json(results);
        });
    });

    // =====================================
    // CitySmart Menu Filter SECTION =======
    // =====================================

    // app.get('/EditData', function (req, res) {
    //     res.setHeader("Access-Control-Allow-Origin", "*");
    //     con_CS.query("SELECT Full Name, Address Line 1, Address Line 2, City, State/Province/Region, Postal Code/ZIP, Country, Email, Phone Number, Layer Name, Layer Category, Layer Description, Layer Uploader FROM GeneralFormDatatable", function (err, results) {
    //         if (err) throw err;
    //     })
    // });

    // =====================================
    // CitySmart Dynamic Menu SECTION ======
    // =====================================

    app.get('/layername', function (req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        con_CS.query("SELECT LayerName From LayerMenu", function (err, result) {
            let JSONresult = JSON.stringify(result, null, "\t");
            res.send(JSONresult);
        });
    });

    // =====================================
    // Others  =============================
    // =====================================
    app.get('Cancel', function (req, res) {
        res.redirect('/userHome');
        res.render('userHome', {
            user: req.user // get the user out of session and pass to template
        });
    });


// Customized Functions Below
    function isLoggedIn(req, res, next) {

        // if user is authenticated in the session, carry on
        if (req.isAuthenticated())
            return next();

        // if they aren't redirect them to the bak page
        res.redirect('/');
    }

    function dateNtime() {
        today = new Date();
        date2 = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        time2 = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        dateTime = date2 + ' ' + time2;
    }

    function tokenExpTime() {
        today = new Date();
        date3 = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + (today.getDate() + 1);
        time3 = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        tokenExpire = date3 + ' ' + time3;
    }

    function updateDBNres(SQLstatement, Value, ErrMsg, targetURL, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        con_CS.query(SQLstatement, Value, function (err, rows) {
            if (err) {
                console.log(err);
                res.json({"error": true, "message": ErrMsg});
            } else {
                res.json({"error": false, "message": targetURL});
            }
        })
    }

    function updateDBNredir(SQLstatement, Value, ErrMsg, failURL, redirURL, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        con_CS.query(SQLstatement, Value, function (err, rows) {
            if (err) {
                console.log(err);
                res.render(failURL, {message: req.flash(ErrMsg)});
            } else {
                res.redirect(redirURL);
                // render the page and pass in any flash data if it exists
            }
        })
    }

    function QueryStat(myObj, sqlStat, res) {
        let j = 0;
        let NewsqlStat = sqlStat;
        let aw;
        for (let i = 0; i < myObj.length; i++) {
            if (!!myObj[i].adj){

                if (j === 0) {
                    aw = " WHERE ";
                    j = 1;
                } else {
                    aw = " AND ";
                }

                sqlStat = editStat(sqlStat, aw, myObj[i].dbCol, myObj[i].op, myObj[i].fieldVal); //scoutingStat is initial statement and the rest says if the column equals the value

                if (i === myObj.length - 1) {
                    NewsqlStat = sqlStat + "; ";
                    console.log(NewsqlStat);
                    dataList(NewsqlStat, res);
                }
            } else {
                // console.log(aw);
                if (i === myObj.length - 1) {
                    NewsqlStat = sqlStat + "; ";
                    console.log(NewsqlStat);
                    dataList(NewsqlStat, res);
                }
            }
        }

        function editStat(stat, aw, dbCol, op, fieldVal) {
            stat += aw + dbCol + op + fieldVal + "'";
            return stat;
        }
    }

    function dataList(sqlStatement, res) {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
        // console.log("SQL:");
        console.log("SQL:" + sqlStatement);
        con_CS.query(sqlStatement, function (err, results) {

            if (err) {
                console.log(err);
                res.json({"errMsg": "fail"});
            } else if (results.length === 0) {
                res.json({"errMsg": "no data"});
            } else {
                res.json(results)
            }
        });
    }

    function changeMail(str) {
        let spliti = str.split("@");
        let letter1 = spliti[0].substring(0, 1);
        let letter2 = spliti[0].substring(spliti[0].length - 1, spliti[0].length);
        let newFirst = letter1;
        for (i = 0; i < spliti[0].length - 2; i++) {
            newFirst += "*";
        }
        newFirst += letter2;

        let letter3 = spliti[1].substring(0, 1);
        let extension = letter3;
        for (let i = 0; i < spliti[1].split(".")[0].length - 1; i++) {
            extension += "*";
        }
        extension += "." + spliti[1].split(".")[1];
        let result = newFirst + "@" + extension;

        return result;
    }

    function sendToken(username, subject, text, url, res) {
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    token = buf.toString('hex');
                    tokenExpTime();
                    done(err, token, tokenExpire);
                });
            },
            function (token, tokenExpire, done) {
                myStat = "UPDATE UserLogin SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE username = '" + username + "' ";
                myVal = [token, tokenExpire];
                con_CS.query(myStat, myVal, function (err, rows) {

                    if (err) {
                        console.log(err);
                        res.json({"error": true, "message": "Token Insert Fail !"});
                    } else {
                        done(err, token);
                    }
                });
            },
            function(token, done, err) {
                // Message object
                const message = {
                    from: 'FTAA <aaaa.zhao@g.northernacademy.org>', // sender info
                    to: username, // Comma separated list of recipients
                    subject: subject, // Subject of the message

                    // plaintext body
                    text: 'You are receiving this because you (or someone else) have requested ' + text + '\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        url + token + '\n\n' +
                        'If you did not request this, please ignore this email.\n'
                };

                smtpTrans.sendMail(message, function(error){
                    if(error){
                        console.log(error.message);
                        res.json({"error": true, "message": "An unexpected error occurred !"});
                    } else {
                        res.json({"error": false, "message": "Message sent successfully !"});
                        // alert('An e-mail has been sent to ' + req.body.username + ' with further instructions.');
                    }
                });
            }
        ], function(err) {
            if (err) return next(err);
            // res.redirect('/forgot');
            res.json({"error": true, "message": "An unexpected error occurred !"});
        });
    }

    function sendToken3(username, subject, text, url, res) {
        async.waterfall([

            function(done) {
                // Message object
                const message = {
                    from: 'FTAA <aaaa.zhao@g.northernacademy.org>', // sender info
                    to: username, // Comma separated list of recipients
                    subject: subject, // Subject of the message

                    // plaintext body
                    text: 'You are receiving this because you (or someone else) have requested ' + text + '\n\n' +
                        'Please user the following code to complete the authentication:\n\n' +
                        url +'\n\n' +
                        'If you did not request this, please ignore this email.\n'
                };

                smtpTrans.sendMail(message, function(error){
                    if(error){
                        console.log(error.message);
                        res.json({"error": true, "message": "An unexpected error occurred !"});
                    } else {
                        res.json({"error": false, "message": "Message sent successfully !"});
                        // alert('An e-mail has been sent to ' + req.body.username + ' with further instructions.');
                    }
                });
            }
        ], function(err) {
            if (err) return next(err);
            // res.redirect('/forgot');
            res.json({"error": true, "message": "An unexpected error occurred !"});
        });
    }

    function sendToken2(username, subject, text, url, res) {
        async.waterfall([
            function(done) {
                // Message object
                const message = {
                    from: 'FTAA <aaaa.zhao@g.northernacademy.org>', // sender info
                    to: username, // Comma separated list of recipients
                    subject: subject, // Subject of the message

                    // plaintext body
                    text: 'This email is sent to inform all admins that user ' + username + ' has ' + text + '\n\n' +
                        'Please click on the following link, or paste this into your browser to review the new layer:\n\n' +
                        url + '\n\n'
                };

                smtpTrans.sendMail(message, function(error){
                    if(error){
                        console.log(error.message);
                        res.json({"error": true, "message": "An unexpected error occurred !"});
                        // alert('it didnt work :(');
                    } else {
                        res.json({"error": false, "message": "Message sent successfully !"});
                        // alert('An e-mail has been sent to ' + username + ' with further instructions.');
                    }
                });
            }
        ], function(err) {
            if (err) return next(err);
            // res.redirect('/forgot');
            res.json({"error": true, "message": "An unexpected error occurred !"});
        });
    }


    function sendname(username, subject, text, url, res){
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    token = buf.toString('hex');
                    tokenExpTime();
                    done(err, token, tokenExpire);
                });
            },
            function (token, tokenExpire, done) {
                myStat = "UPDATE UserLogin SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE PendingUsername = '" + username + "' ";
                myVal = [token, tokenExpire];
                con_CS.query(myStat, myVal, function (err, rows) {

                    if (err) {
                        console.log(err);
                        res.json({"error": true, "message": "Token Insert Fail !"});
                    } else {
                        done(err, token);
                    }
                });
            },
            function(token, done, err) {
                // Message object
                const message = {
                    from: 'FTAA <aaaa.zhao@g.northernacademy.org>', // sender info
                    to: username, // Comma separated list of recipients
                    subject: subject, // Subject of the message
                    // plaintext body
                    text: 'You are receiving this because you (or someone else) have requested ' + text + '\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        url + token + '\n\n' +
                        'If you did not request this, please ignore this email.\n'
                };

                smtpTrans.sendMail(message, function(error){
                    if(error){
                        console.log(error.message);
                        res.json({"error": true, "message": "An unexpected error occurred !"});
                    } else {
                        res.json({"error": false, "message": "Message sent successfully !"});
                        // alert('An e-mail has been sent to ' + req.body.username + ' with further instructions.');
                    }
                });
            }
        ], function(err) {
            if (err) return next(err);
            res.json({"error": true, "message": "An unexpected error occurred !"});
        });
    }

    function successMail(username, subject, text, res) {
        const message = {
            from: 'FTAA <aaaa.zhao@g.northernacademy.org>',
            to: username,
            subject: subject,
            text: text
        };

        smtpTrans.sendMail(message, function (error) {
            if(error){
                console.log(error.message);
            } else {
                res.render('success.ejs', {});
            }
        });
    }

    let getDegree = function (deg,lat1,lon1,lat2,lon2){
        a1=deg2rad(lat1)
        a2=deg2rad(lat2)
        var b1=deg2rad(lon1)
        var b2=deg2rad(lon2)
        const y = Math.sin(b2-b1) * Math.cos(a2);
        const x = Math.cos(a1)*Math.sin(a2) -
            Math.sin(a1)*Math.cos(a2)*Math.cos(b2-b1);
        const c = Math.atan2(y, x);
        var brng = (c*180/Math.PI + 360) % 360; // in degrees
        // if(brng>180){
        //     brng=brng-360
        // }
        var degree=brng-deg;
        // if(degree>360){
        //     degree=degree-360;
        // }
        // if(degree>180){
        //     degree=degree-360
        // }
        // if(degree<-180){
        //     degree=360+degree
        // }
        return degree
    }

    function pair(Flag, Pair, email) {
        // console.log("Pair running")
        for (var i = 0; i < Flag.length; i++) {//checking x
            // console.log("pair round " + i)
            // console.log(Flag[i][0].stationInfo.StationName)
            // console.log(i)
            for (var b = 0; b < Flag[i][1].length - 1; b++) {
                if (Date.parse(Flag[i][1][b + 1].time) - Date.parse(Flag[i][1][b].time) < serverConfig.SpikeTimeLimit && Flag[i][1][b].DiffX * Flag[i][1][b + 1].DiffX < 0) {
                    var array = [];
                    array.push(Flag[i][1][b], Flag[i][1][b + 1])
                    Pair[i][1].push(array);
                    Flag[i][1].splice(b, 2)
                    // console.log("pair x push")
                    b--;
                    //so the format will look like [ [{stationname}, [{},{}],...],...]
                    //when finish compair, it will be deleted.
                } else {
                    // Flag[i][1].splice(b, 1);
                    // b--;

                }
            }
            //checking y
            for (var a = 0; a < Flag[i][2].length - 1; a++) {
                if (Date.parse(Flag[i][2][a + 1].time) - Date.parse(Flag[i][2][a].time) < serverConfig.SpikeTimeLimit && Flag[i][2][a].DiffY * Flag[i][2][a + 1].DiffY < 0) {
                    var array2 = [];
                    array2.push(Flag[i][2][a], Flag[i][2][a + 1])
                    Pair[i][2].push(array2);
                    Flag[i][2].splice(1, 2)
                    // console.log("pair y push")
                    a--;
                    //so the format will look like [ [{stationname}, [[{},{}],...],[[{},{}],...]],...]
                    //when finish compair, it will be deleted.
                } else {
                    // Flag[i][2].splice(a, 1);
                    // a--;

                }
            }
        }

        if (i === Flag.length) {
            // console.log("these re pair")
            // console.log("This is sta2 xs " + Pair[0][1].length + ", and ys " + Pair[0][2].length)
            // console.log("This is sta3 xs " + Pair[1][1].length + ", and ys " + Pair[1][2].length)
            // console.log("This is sta4 xs " + Pair[2][1].length + ", and ys " + Pair[2][2].length)
            // console.log(Pair[0])
            // console.log(Pair[1])
            // console.log(Pair[2])
            matching(Pair, email)
            // valid(Pair,email)
        }
    }

    //grabbing data from table and then pair them
    async function pairTable(stations, email) {
        // console.log("PairTable running");
        //get data first
        // console.log("iii: A");
        // async.each(rows, function (row, callback) {
        //     conn.query("SELECT * FROM ESP2.Flags WHERE Station='" + Flag[0][0].stationInfo.StationName + "' AND Direction='X' AND Time>'"+someHour()+"'", row.col, callback);
        // }, function () {
        //     // all queries are done
        // })
        // console.log("SELECT * FROM ESP2.Flags WHERE Station='" + Flag[0][0].stationInfo.StationName + "' AND Direction='X' AND Time>'"+someHour()+"'")
        // con.query("SELECT * FROM ESP2.Flags WHERE Station='" + Flag[0][0].stationInfo.StationName + "' AND Direction='X' AND Time>'"+someHour()+"'", function (err, result) {
        //     if (err) throw err;
        //     console.log(result.length);
        // console.log(Flag.length)
        // console.log(i)
        //checking x
// })


        // console.log(stations);
        for(let i=0; i<stations.length;i++) {//checking x
            // console.log(item)
            var item = stations[i]
            // var i=stations.indexOf(item)
            // console.log(callback);
            // console.log("SELECT * FROM ESP2.Flags WHERE Station='" + item.StationName + "' AND Direction='X' AND Time>'" + someHour() + "'")
            await con.query("SELECT * FROM ESP2.Flags WHERE Station='" + item.StationName + "' AND Direction='X' AND Time>'" + someHour() + "'", async function (err, result) {
                if (err) throw err;
                // console.log("pairTable round " + i)
                // console.log(result.length);

                // console.log(Flag.length)
                // console.log(i)
                //checking x
                for (var b = 0; b < result.length - 1; b++) {
                    // console.log(Date.parse(result[b + 1].Time))
                    if (Date.parse(result[b + 1].Time) - Date.parse(result[b].Time) < serverConfig.SpikeTimeLimit && result[b].DiffX * result[b + 1].DiffX < 0) {
                        var array = [];
                        array.push(result[b], result[b + 1])
                        // Pair[i][1].push(array);
                        // console.log(result[b])
                        var sql = "INSERT IGNORE INTO ESP2.Spikes (Station, Direction, Limits, BeginningTime, EndingTime, DiffX, DiffY) VALUES ('" + result[b].Station + "','" + result[b].Direction + "','" + result[b].Limits + "','" + result[b].Time + "','" + result[b + 1].Time + "','" + result[b].DiffX + "','" + result[b].DiffY + "')";
                        await con.query(sql, function (err, result) {
                            if (err) throw err;
                            // console.log("1 record inserted");
                        });
                        // result.splice(b, 2)
                        // console.log("pair x push")
                        // b--;
                        //so the format will look like [ [{stationname}, [{},{}],...],...]
                        //when finish compair, it will be deleted.
                    } else {
                        // result.splice(b, 1);
                        // b--;

                    }
                }
            })
            // console.log("iiiii: "+i);
            await con.query("SELECT * FROM ESP2.Flags WHERE Station='" + item.StationName + "' AND Direction='Y' AND Time>'" + someHour() + "'", async function (err, result) {
                if (err) throw err;
                // console.log(result.length)

                //checking y
                for (var a = 0; a < result.length - 1; a++) {
                    // console.log(result[a + 1].Time)
                    if (Date.parse(result[a + 1].Time) - Date.parse(result[a].Time) < serverConfig.SpikeTimeLimit && result[a].DiffY * result[a + 1].DiffY < 0) {
                        var array2 = [];
                        array2.push(result[a], result[a + 1])
                        // Pair[i][2].push(array2);
                        var sql = "INSERT IGNORE INTO ESP2.Spikes (Station, Direction, Limits, BeginningTime, EndingTime, DiffX, DiffY) VALUES ('" + result[a].Station + "','" + result[a].Direction + "','" + result[a].Limits + "','" + result[a].Time + "','" + result[a + 1].Time + "','" + result[a].DiffX + "','" + result[a].DiffY + "')";
                        // console.log(sql)
                        await con.query(sql, function (err, result) {
                            if (err) throw err;
                            // console.log("1 record inserted");
                        });
                        // result.splice(1, 2)
                        // console.log("pair y push")
                        // a--;
                        //so the format will look like [ [{stationname}, [[{},{}],...],[[{},{}],...]],...]
                        //when finish compair, it will be deleted.
                    } else {
                        // result.splice(a, 1);
                        // a--;

                    }
                }
            });
            if (i === stations.length - 1) {
                // console.log("these are pairs")
                // console.log("This is sta2 xs " + Pair[0][1].length + ", and ys " + Pair[0][2].length)
                // console.log("This is sta3 xs " + Pair[1][1].length + ", and ys " + Pair[1][2].length)
                // console.log("This is sta4 xs " + Pair[2][1].length + ", and ys " + Pair[2][2].length)
                // console.log(Pair[0])
                // console.log(Pair[1])
                // console.log(Pair[2])
                matchingTable(stations, email)
                // valid(Pair,email)
            }
        }
    }

    //this is the alarm that will send out the notification link to the specific email
// StationName,City,State,StationId,Longitude,Latitude
    function alarm(city, state, lo, la, timeFrom, timeTo, stationId, stationName, email,
                   city2, state2, lo2, la2, timeFrom2, timeTo2, stationId2, stationName2,
                   bd1x, bd1y, bd2x, bd2y) {
        // console.log(timeFrom,timeTo,stationId,stationName)
        //send record to table

        var degree1 = degrees(bd1x, bd1y)
        var degree2 = degrees(bd2x, bd2y)
        //here is final deg between two
        var deg = Math.abs(degree1 - degree2)
        // if (deg > 180) {
        //     deg = deg-360
        // }
        // console.log(deg)

        // var link = 'http://localhost:3005/newEjs?timeFrom=' + timeFrom + '&timeTo=' + timeTo + '&city=' + city + '&state=' + state + '&lo=' + lo + '&la=' + la + '&stationName=' + stationName + '&stationId=' + stationId
        //     + '&timeFrom2=' + timeFrom2 + '&timeTo2=' + timeTo2 + '&city2=' + city2 + '&state2=' + state2 + '&lo2=' + lo2 + '&la2=' + la2 + '&stationName2=' + stationName2 + '&stationId2=' + stationId2
        //     + '&bdx=' + bd1x + '&bdy=' + bd1y + '&bdx2=' + bd2x + '&bdy2=' + bd2y
        var link='/newEjs?timeFrom=' + timeFrom + '&timeTo=' + timeTo + '&city=' + city + '&state=' + state + '&lo=' + lo + '&la=' + la + '&stationName=' + stationName + '&stationId=' + stationId
            + '&timeFrom2=' + timeFrom2 + '&timeTo2=' + timeTo2 + '&city2=' + city2 + '&state2=' + state2 + '&lo2=' + lo2 + '&la2=' + la2 + '&stationName2=' + stationName2 + '&stationId2=' + stationId2
            + '&bdx=' + bd1x + '&bdy=' + bd1y + '&bdx2=' + bd2x + '&bdy2=' + bd2y
        var slink = String(link)


        // if (err) throw err;
        // console.log("Connected!");
        var sql = "INSERT IGNORE INTO ESP2.AnomalyTable (BeginningTime, EndingTime, Degrees, Station1,Station2, Link,Degree1,Degree2) VALUES ('" + timeFrom + "','" + timeTo + "','" + deg + "','" + stationName + "','"+ stationName2 + "','" + slink + "','" + degree1 + "','" + degree2 + "')";
        // console.log(sql)
        con.query(sql, function (err, result) {
            if (err) throw err;
            // console.log("1 record inserted");
        });


        const mailOptions = {
            from: 'aaaa.zhao@g.northernacademy.org',
            to: email,
            subject: 'ESP Station Data',
            // html: '<p><a href="http://localhost:3005/newEjs?timeFrom=' + timeFrom + '&timeTo=' + timeTo + '&city=' + city + '&state=' + state + '&lo=' + lo + '&la=' + la + '&stationName=' + stationName + '&stationId=' + stationId
            //     + '&timeFrom2=' + timeFrom2 + '&timeTo2=' + timeTo2 + '&city2=' + city2 + '&state2=' + state2 + '&lo2=' + lo2 + '&la2=' + la2 + '&stationName2=' + stationName2 + '&stationId2=' + stationId2
            //     + '&bdx=' + bd1x + '&bdy=' + bd1y + '&bdx2=' + bd2x + '&bdy2=' + bd2y + '">' +
            //     'From ' + timeFrom + " to " + timeTo + ", there is an anomaly happened on station " + stationName
            //     + ". At the same time, there is an anomaly happened on station " + stationName2 + ", and the time range is " + timeFrom2 + " to " + timeTo2 + "." + '</a></p>'

            html: '<p><a href="/newEjs?timeFrom=' + timeFrom + '&timeTo=' + timeTo + '&city=' + city + '&state=' + state + '&lo=' + lo + '&la=' + la + '&stationName=' + stationName + '&stationId=' + stationId
                + '&timeFrom2=' + timeFrom2 + '&timeTo2=' + timeTo2 + '&city2=' + city2 + '&state2=' + state2 + '&lo2=' + lo2 + '&la2=' + la2 + '&stationName2=' + stationName2 + '&stationId2=' + stationId2
                + '&bdx=' + bd1x + '&bdy=' + bd1y + '&bdx2=' + bd2x + '&bdy2=' + bd2y + '">' +
                'From ' + timeFrom + " to " + timeTo + ", there is an anomaly happened on station " + stationName
                + ". At the same time, there is an anomaly happened on station " + stationName2 + ", and the time range is " + timeFrom2 + " to " + timeTo2 + "." + '</a></p>'

        };


        // transporter.sendMail(mailOptions, function (error, info) {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         //http://localhost:3005/newEjs?stationID=3333&dateTime=8888
        //         // console.log('Email sent: ' + info.response);
        //     }
        // });

        // if (Math.abs(deg) < serverConfig.DegreeLimit) {
        //     transporter.sendMail(mailOptions, function (error, info) {
        //         if (error) {
        //             console.log(error);
        //         } else {
        //             //http://localhost:3005/newEjs?stationID=3333&dateTime=8888
        //             // console.log('Email sent: ' + info.response);
        //         }
        //     });
        // }
    }

    async function EventCheck(stations, Flag, Pair, email) {
        let minute = serverConfig.TimeAhead;
        try {
            var preSta = stations;
            // console.log("event check begin")
            con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'", function (err, result) {
                var newSta = result;
                if (newSta.length !== preSta.length && preSta.length < newSta.length) {
                    for (var i = 0; i < newSta.length - preSta.length; i++) {
                        FlagN.push([{stationInfo: result[preSta.length + i + 1]}, [], []]);
                        PairN.push([{stationInfo: result[preSta.length + i + 1]}, [], []]);
                        // if(i===result.length-1){
                        //     EventCheck(result,FlagN,PairN);
                        // }
                    }
                }
            });
            // console.log("all begin");
            //check each station's data one by one
            // console.log("stations length is "+stations.length)
            for (var i = 0; i < stations.length; i++) {
                // console.log("one round");
                var querystatement = 'SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >= now()-' + minute + ' AND time<= now()';
                var test = 'SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >=' + ' \'2021-01-10T00:00:10Z\'' + ' AND ' + 'time<= \'2021-01-20T00:00:50Z\'';
                // console.log(querystatement);
                // pairTable(stations, email)
                // console.log(querystatement);
                await influx.query(querystatement).then
                ((result, k = i) => {
                    // timer.set(1000, 'Timeout!')
                    // console.log('this is result');
                    // console.log(result.length);
                    // console.log(result);
                    // console.log(result[0].X);
                    // console.log(re                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               sult[0].Y);
                    // console.log(result[0].Z);
                    // console.log(i+querystatement);
                    // console.log(result[0].time._nanoISO);
                    // console.log(result);
                    // check the Flag here
                    // console.log("begin flag")
                    // flag(result, Flag, Pair, email)

                    // function flag(result, Flag, Pair, email) {
                    // console.log(k)
                    for (var a = 0; a < result.length-1; a++) {
                        // DifA = result[a + 1].X - result[a].X;
                        // console.log(a);
                        // console.log(result.length)
                        var DifB = result[a + 1].X - result[a].X;
                        var DifA = result[a + 1].Y - result[a].Y;
                        // console.log("this is difference");
                        // console.log(DifB);
                        if (Math.abs(DifB) > serverConfig.Limit) {
                            // console.log(DifB);
                            // console.log(k)
                            // console.log(Flag)
                            Flag[k][1].push({
                                stationInfo: stations[i],
                                time: result[a].time._nanoISO,
                                X: result[a].X,
                                Y: result[a].Y,
                                Z: result[a].Z,
                                DiffX: DifB,
                                DiffY: DifA
                            });
                            // console.log(DifB);
                            var sql = "INSERT IGNORE INTO ESP2.Flags (Station, Direction, Limits, Time, BaseX, BaseY, BaseZ, DiffX, DiffY) VALUES ('" + stations[k].StationName + "','X','"+serverConfig.LimitStr+"','" + result[a].time._nanoISO + "','" + result[a].X + "','" + result[a].Y + "','" + result[a].Z + "','" + DifB + "','" + DifA + "')";
                            con.query(sql, function (err, result) {
                                if (err) {throw err;
                                    return true;}
                                // console.log("1 flag inserted");
                            });
                            // console.log("pushed")
                            // DifB = null;
                        } else if (Math.abs(DifA) > serverConfig.Limit) {
                            // console.log(Flag[k][2])
                            Flag[k][2].push({
                                stationInfo: stations[i],
                                time: result[a].time._nanoISO,
                                X: result[a].X,
                                Y: result[a].Y,
                                Z: result[a].Z,
                                DiffY: DifA,
                                DiffX: DifB
                            });
                            // console.log("pushed")
                            var sql = "INSERT IGNORE INTO ESP2.Flags (Station, Direction, Limits, Time, BaseX, BaseY, BaseZ, DiffX, DiffY) VALUES ('" + stations[k].StationName + "','Y','"+serverConfig.LimitStr+"','" + result[a].time._nanoISO + "','" + result[a].X + "','" + result[a].Y + "','" + result[a].Z + "','" + DifB + "','" + DifA + "')";
                            con.query(sql, function (err, result) {
                                if (err) throw err;
                                // console.log("1 flag inserted");
                            });
                            // DifA = null;
                        } else {
                            DifA = null;
                            DifB = null;
                        }
                        // console.log(a)
                        // console.log(result.length)

                    }
                    // console.log(EQstations.length)

                }).catch(err => {
                    console.log("Errors: ");
                    console.log(err)
                    // EventCheck(EQstations, FlagN, PairN, DeEmail)

                });
                if (i === EQstations.length - 1) {
                    // console.log("flag round done at" + Date());
                    // console.log("Flag length sta2 x is " + Flag[0][1].length + ", and y is " + Flag[0][2].length);
                    // console.log("Flag length sta3 x is " + Flag[1][1].length + ", and y is " + Flag[1][2].length);
                    // console.log("Flag length sta4 x is " + Flag[2][1].length + ", and y is " + Flag[2][2].length);
                    // console.log(Flag[1][2]);
                    // await pair(Flag, Pair, email)
                    await pairTable(stations, email)
                    // console.log("PAIR has been run")
                    // await seconds(Flag,email)
                    setInterval(
                        EventCheck
                        , serverConfig.RepeatingTime, EQstations, FlagN, PairN, DeEmail);
                    // setInterval(
                    //     Delete
                    //     , 3600000, PairN, FlagN);
                }
            }


        } catch (err) {
            console.log(err)
        }
    }

    //comparing between xx yy xy yx
    async function matchingTable(stations, email) {
        // console.log("matching running")
        var stations;
        var pairsArr = []
        var i=0;
        for(i=0;i<stations.length;i++){
            // var one=stations[i], two;
            // i=stations.indexOf(item);
            //pack all x and y of comparing station into one array
            // console.log("SELECT * FROM ESP2.Spikes WHERE Station='" + stations[i].StationName  + "' AND EndingTime>'" + someHour() + "'")
            con.query("SELECT * FROM ESP2.Spikes WHERE Station='" + stations[i].StationName  + "' AND EndingTime>'" + someHour() + "'", async function (err, result) {
                if (err) throw err;
                // console.log(i)
                // console.log(stations)
                // console.log(result.length);
                if(result.length!==0) {
                    // console.log(result)
                    pairsArr.push(result)
                }else{
                    pairsArr.push(["This station's result is empty"])
                }
                // console.log(pairsArr.length)
                if (pairsArr.length===stations.length){
                    // console.log("pairsArr being called")
                    await pairsArr.forEach(Packing)
                }
            });
        }

        function Packing(item, index) {
            if ( typeof item[0]=== "string" ) {
                return;
            }

            var Compairing = item;
            var Compaired = []
            //pack all xs and yx of  the rested compaired stations into one array
            for (a = index + 1; a < pairsArr.length ; a++) {
                Compaired = Compaired.concat(pairsArr[a])
                if(a===pairsArr.length-1){
                    Compairing.forEach(CoMa);
                }
            }
            if(index===pairsArr.length){
                return;
            }

            //begin to compair now

            function CoMa(comparingItem, comparingI) {
                // console.log("comparingItem")t
                // console.log(comparingI)
                Compaired.forEach(function (el, i) {
                        // console.log("running")
                        // console.log(i)


                        if (Date.parse(comparingItem.EndingTime) > Date.parse(el.BeginningTime)
                            && Date.parse(comparingItem.EndingTime) < Date.parse(el.EndingTime)) {
                            // console.log(comparingItem)
                            for(var b=0;b<stations.length;b++){
                                if(stations[b].StationName===comparingItem.Station){
                                    var compairingItemStationInfo=stations[b]
                                    // console.log(compairingItemStationInfo)
                                }
                                if(stations[b].StationName===el.Station){
                                    var elStationInfo=stations[b]
                                    // console.log(elStationInfo)
                                }
                                if(b===stations.length-1){
                                    alarm(elStationInfo.City, elStationInfo.State, elStationInfo.Longitude, elStationInfo.Latitude, el.BeginningTime, el.EndingTime, elStationInfo.StationId, elStationInfo.StationName, email,
                                        compairingItemStationInfo.City, compairingItemStationInfo.State, compairingItemStationInfo.Longitude, compairingItemStationInfo.Latitude, comparingItem.BeginningTime, comparingItem.EndingTime, compairingItemStationInfo.StationId, compairingItemStationInfo.StationName,
                                        el.DiffX, el.DiffY, comparingItem.DiffX, comparingItem.DiffY);
                                }
                            }


                        } else if (Date.parse(el.EndingTime) > Date.parse(comparingItem.BeginningTime)
                            && Date.parse(el.EndingTime) < Date.parse(comparingItem.EndingTime)) {
                            for(var b=0;b<stations.length;b++){
                                if(stations[b].StationName===comparingItem.Station){
                                    compairingItemStationInfo=stations[b]
                                    // console.log(compairingItemStationInfo)
                                }
                                if(stations[b].StationName===el.Station){
                                    var elStationInfo=stations[b]
                                    // console.log(elStationInfo)
                                }
                                if(b===stations.length-1){
                                    alarm(elStationInfo.City, elStationInfo.State, elStationInfo.Longitude, elStationInfo.Latitude, el.BeginningTime, el.EndingTime, elStationInfo.StationId, elStationInfo.StationName, email,
                                        compairingItemStationInfo.City, compairingItemStationInfo.State, compairingItemStationInfo.Longitude, compairingItemStationInfo.Latitude, comparingItem.BeginningTime, comparingItem.EndingTime, compairingItemStationInfo.StationId, compairingItemStationInfo.StationName,
                                        el.DiffX, el.DiffY, comparingItem.DiffX, comparingItem.DiffY);
                                }
                            }

                        }
                    }
                    // .catch(err => {
                    //     console.log("Errors: ");
                    //     console.log(err)
                    // })
                );
            }


        }
    }

    async function moon(timeFrom, timeTo, Flag, Pair, email) {
        try {
            for (var i = 0; i < EQstations.length; i++) {
                Flag.push([{stationInfo: EQstations[i]}, [], []]);
                Pair.push([{stationInfo: EQstations[i]}, [], []]);
                var Qstring = 'SELECT * FROM ' + EQstations[i].StationId + 'avg WHERE time >= ' + "\'" + timeFrom + "\'" + ' AND time<= ' + "\'" + timeTo + "\'";
                // console.log(Qstring)
                await influx.query(Qstring).then
                (result => {
                    // console.log("result")
                    // console.log(result.length)
                    for (var a = 0; a < result.length; a++) {
                        var DifB = result[a + 1].X - result[a].X;
                        var DifA = result[a + 1].Y - result[a].Y;
                        if (Math.abs(DifB) > serverConfig.Limit) {
                            Flag[i][1].push({
                                stationInfo: EQstations[i],
                                time: result[a].time._nanoISO,
                                X: result[a].X,
                                Y: result[a].Y,
                                Z: result[a].Z,
                                DiffX: DifB,
                                DiffY: DifA
                            });
                            var DifB = null;
                        } else if (Math.abs(DifA) > serverConfig.Limit) {
                            Flag[i][2].push({
                                stationInfo: EQstations[i],
                                time: result[a].time._nanoISO,
                                X: result[a].X,
                                Y: result[a].Y,
                                Z: result[a].Z,
                                DiffY: DifA,
                                DiffX: DifB
                            });
                            var DifA = null;
                        } else {
                            DifA = null
                            DifB = null;
                        }
                    }
                }).catch(err => {
                    console.log("Errors: ");
                    console.log(err)
                });
                if (i === EQstations.length - 1) {
                    // console.log("this is flag")
                    // console.log(Flag[0].length);
                    // console.log(Flag[1].length);
                    // console.log(Flag[2].length);
                    await pair(Flag, Pair, email)
                    // await seconds(Flag,email)
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    function someHour(){
        var d = new Date();
        d.setHours(d.getHours() - serverConfig.HourAhead);
        // console.log("oiiii: "+d.toISOString());
        // console.log(new Date().toISOString())
        return d.toISOString()
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }
*/
};
