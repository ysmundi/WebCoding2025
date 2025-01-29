// config/database.js
let serverConfig = {
    commondb_connection: {
        'multipleStatements': true,
        'connectionLimit' : 100,
        // 'host': 'localhost',
        'host': '10.11.90.15',
        'user': 'AppUser',
        'password': 'Special888%',
        'port'    :  3306
    },
    session_connection: {
        'multipleStatements': true,
        'connectionLimit' : 100,
        // 'host': 'localhost',
        'host': '10.11.90.15',
        'user': 'AppUser',
        'password': 'Special888%',
        'port'    :  3306
    },

    Session_db: 'fblawebcoding',
    Login_db: 'fblawebcoding',
    Login_table: 'UserLogin',
    Upload_db: 'fblawebcoding',

    Server_Port: 9092,

    // local_URL : "",
    // local_URL : "http://viewer.usgs.aworldbridgelabs.com",

    //upload path to geoserver when approved
    geoServer : 'http://cs.aworldbridgelabs.com:8080/geoserver/',
    // geoServer : 'http://10.11.90.15:8080/geoserver/',

    //sysnchronization between approvedfolder and data folder under geoserver when approved
    // Sync_Dir : '/usr/share/geoserver-2.15.0/data_dir/data/Approved',
    // Sync_Dir : 'syncfolder',

    //download/backup wmsCapabilities file (xml)
    Download_From : 'https://cors.aworldbridgelabs.com:9084/http://cs.aworldbridgelabs.com:8080/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities',
    Download_To:'../config/ows.xml',
    Backup_Dir:'../config/geoCapacity',

    //upload file--pending
    Pending_Dir: 'uploadfolder',
    Reject_Dir: 'rejectfolder',

    //approve file--active
    Approve_Dir: 'approvedfolder',

    //trashfolder file--trashfolder
    Delete_Dir: 'trashfolder',

    num_backups: 24,
    download_interval: 36000000,


    mail: {
        service: 'Gmail',
        auth: {
            // user: 'yge5095@gmail.com',
            // pass: '1syyRFLATs%'
            user: 'aaaa.zhao@g.northernacademy.org',
            pass: 'qwer1234'
        }
    },
    influx:{
        precision: 'rfc3339',
        host: 'aworldbridgelabs.com',
        database: 'RayESP',
        username: "rayf",
        password: "RayESP8010",
        port: 8086
    },
    //lab
    mysql:{
        host: "10.11.90.15",
        // host: "localhost",
        user: "AppUser",
        password: "Special888%",
        port: "3306",
        Schema: "ESP2"
        // Table: "stationdata"
    },
    //home
    // mysql:{
    //     // host: "10.11.90.15",
    //     host: "localhost",
    //     user: "root",
    //     password: "RayESP8010",
    //     port: "3306",
    //     Schema: "ESP2"
    //     // Table: "stationdata"
    // },

    PastTime:'3d',//This part controls
    NowTime:'2m',//the time range shows in the index(home) page.

    // ServerPort:"3005",
    email:'esp_notify@northernacademy.org',
    DegreeLimit:90,//if the degree is bigger than this limit, it will not send notification

//UPDATE DATA INFO HERE
    dateBeginning:'2021-03-31T16:17:18.795Z',
    dateEnding:'2021-04-30T16:17:18.795Z',
    duration:'1440m',//time duration of updateData, 1 days
    durations:86400000,//miliseconds, 1days for rn


    //in anomaly table, change the days ahead of event here
    day:5,//day




    //download/backup wmsCapabilities file (xml)
    SpikeTimeLimit:1800000,//milliseconds, the longest time duration of a spike, 30 mins for rn
    TimeAhead:"180m",//it decides how many time do we get for checking flags, m means minute
    HourAhead:3,//unit: hour
    // TimeAhead:"4320m",//it decides how many time do we get for checking flags, m means minute
    // HourAhead:72,//unit: hour
    Limit:8,//unit: nT
    LimitStr:'8nT',//keep this as a string with a unit plz.
    RepeatingTime:10800000,//unit:milli second, 3 hours for rn

};

module.exports = serverConfig;
