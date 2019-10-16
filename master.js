"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var io = require('socket.io-client');
var socket = io.connect('http://localhost:5000');
var fs = require('fs');
var path = require('path');
// Import api for google search
// WARNING: AMOUNT OF REQUESTS LIMITED TO 3000
// KEY WILL EXPIRE ON 10/30/2019
var GSR = require('google-search-results-nodejs');
var client = new GSR.GoogleSearchResults('49345396a0ce2cf479b956fa34754e5f3f2b3bb1ac048e4c40660cdd17c08cb0');
// Define folder for images
var dir = './public_folders';
// Define log file
var fileName = 'test.log';
// Create log file if not exist
try {
    if (!fs.existsSync('./test.log')) {
        // console.log(fs.existsSync('./test.log'));
        fs.writeFile(path.join(__dirname, fileName), 'This is Log', function (err) {
            if (err)
                throw err;
            console.log('Log file created');
        });
    }
}
catch (err) {
    console.log(err);
}
// Create public_folders if not exists
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
// Variable for saving index of previously sent data
var index = 0;
// Image Received
socket.on('image', function (data) {
    try {
        // Unique name for image file
        var date_1 = Date.now();
        fs.writeFile(path.join(__dirname + '/public_folders', date_1 + '.png'), data.data, 'base64', function (err) {
            if (err)
                console.log(err);
        });
        fs.appendFile(path.join(__dirname, fileName), "\n" + data.index + ". [" + data.date + "] Image: " + date_1 + ".png created", function (err) {
            if (err)
                console.log(err);
            console.log(data.index + ". Image: " + date_1 + ".png created");
        });
        socket.emit('index', { index: data.index, status: 200 });
        index = data.index;
    }
    catch (err) {
        console.log(err);
        socket.emit('index', { index: index, status: 500 });
    }
});
// RawData Recieved
socket.on('rawdata', function (data) {
    try {
        // Error throwing for "catch" testing
        // throw new Error('haha');
        fs.appendFile(path.join(__dirname, fileName), "\n" + data.index + ". [" + data.date + "] : " + data.data + " ", function (err) {
            if (err)
                console.log(err);
            console.log(data.index + '. ' + data.data + ' - added to log file');
        });
        socket.emit('index', { index: data.index, status: 200 });
        index = data.index;
    }
    catch (err) {
        console.log(err);
        socket.emit('index', { index: index, status: 500 });
    }
});
// JSON Received
socket.on('json', function (data) {
    try {
        // Google search uses '+' instead of ' ' or '%20'
        var query = data.data.query.replace(/ /g, '+');
        var parameter = {
            q: query,
            google_domain: 'google.com'
        };
        var callback = function (body) {
            fs.appendFile(path.join(__dirname, fileName), "\n" + data.index + ". [" + data.date + "] : " + data.data.query + " meets " + body.search_information.total_results + " times", function (err) {
                if (err)
                    console.log(err);
                console.log(data.index + ". " + data.data.query + "(" + body.search_information.total_results + ") added to log file");
            });
            socket.emit('index', { index: data.index, status: 200 });
            index = data.index;
        };
        // Sending Request to Google search
        client.json(parameter, callback);
    }
    catch (err) {
        console.log(err);
        socket.emit('index', { index: index, status: 500 });
    }
});
// Master will disconnect randomly for 5 seconds
socket.on('connect', function () {
    var random = Math.floor(Math.random() * 10) * 300 + 10000;
    console.log("Master will disconnect in " + random / 1000 + " seconds");
    setTimeout(function () {
        socket.disconnect();
        setTimeout(function () {
            socket.connect();
        }, 5000);
    }, random);
});
