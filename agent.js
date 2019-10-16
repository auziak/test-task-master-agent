"use strict";
var app = require('http').createServer();
var io = require('socket.io')(app);
var fs = require('fs');
// Import data for sending
var dataArray = require('./data.json');
var PORT = process.env.port || 5000;
app.listen(PORT, function () { return console.log("Server runnig on port " + PORT); });
// console.log(dataArray);
// Function for converting image to binary file
function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
    var buffer = Buffer.from(bitmap);
    return buffer;
    // .toString('base64');
}
var myTimeOut;
var disconnectInt;
// Define index for data which will be sent
var x = 0;
io.on('connection', function (socket) {
    // Main function for sending data to master
    function sendData(arr) {
        if (!arr[x]) {
            console.log('No more data to send');
            return;
        }
        else {
            if (arr[x].type) {
                var date = new Date().toISOString();
                if (arr[x].type === 'image') {
                    var base64str = base64_encode('./images/' + arr[x].imageName);
                    io.emit('image', { data: base64str, index: x, date: date });
                }
                else if (arr[x].type === 'rawdata') {
                    socket.emit('rawdata', { data: arr[x].data, index: x, date: date });
                }
                else if (arr[x].type === 'json') {
                    socket.emit('json', { data: arr[x].data, index: x, date: date });
                }
                else {
                    console.log('This type is not supported');
                }
            }
            else {
                console.log('Wrong format');
                x++;
                sendData(arr);
            }
        }
    }
    // Handle disconnect
    socket.on('disconnect', function () {
        clearTimeout(myTimeOut);
        disconnectInt = setInterval(function () {
            console.log('Connection Lost...');
        }, 1000);
    });
    // Recieving from master answer: which data should be sent next
    socket.on('index', function (data) {
        clearTimeout(myTimeOut);
        if (data.status === 200) {
            x = data.index + 1;
            myTimeOut = setTimeout(function () {
                sendData(dataArray);
            }, 2000);
        }
        else {
            x = data.index + 1;
            myTimeOut = setTimeout(function () {
                sendData(dataArray);
            }, 1000);
        }
    });
    // Clear disconnect message interval
    clearInterval(disconnectInt);
    // Send data when connection installed
    myTimeOut = setTimeout(function () {
        sendData(dataArray);
    }, 2000);
});
