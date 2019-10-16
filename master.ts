export {};
const io = require('socket.io-client');
const socket = io.connect('http://localhost:5000');
const fs = require('fs');
const path = require('path');

// Import api for google search
// WARNING: AMOUNT OF REQUESTS LIMITED TO 3000
// KEY WILL EXPIRE ON 10/30/2019
const GSR = require('google-search-results-nodejs');
let client = new GSR.GoogleSearchResults(
  '49345396a0ce2cf479b956fa34754e5f3f2b3bb1ac048e4c40660cdd17c08cb0'
);

// Define folder for images
const dir = './public_folders';
// Define log file
const fileName = 'test.log';
// Create log file if not exist
try {
  if (!fs.existsSync('./test.log')) {
    // console.log(fs.existsSync('./test.log'));
    fs.writeFile(path.join(__dirname, fileName), 'This is Log', (err: any) => {
      if (err) throw err;
      console.log('Log file created');
    });
  }
} catch (err) {
  console.log(err);
}

// Create public_folders if not exists
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Variable for saving index of previously sent data
let index = 0;

// Image Received
socket.on('image', (data: any) => {
  try {
    // Unique name for image file
    const date = Date.now();
    fs.writeFile(
      path.join(__dirname + '/public_folders', date + '.png'),
      data.data,
      'base64',
      (err: any) => {
        if (err) console.log(err);
      }
    );
    fs.appendFile(
      path.join(__dirname, fileName),
      `\n${data.index}. [${data.date}] Image: ${date}.png created`,
      (err: any) => {
        if (err) console.log(err);
        console.log(`${data.index}. Image: ${date}.png created`);
      }
    );
    socket.emit('index', { index: data.index, status: 200 });
    index = data.index;
  } catch (err) {
    console.log(err);
    socket.emit('index', { index: index, status: 500 });
  }
});

// RawData Recieved
socket.on('rawdata', (data: any) => {
  try {
    // Error throwing for "catch" testing
    // throw new Error('haha');
    fs.appendFile(
      path.join(__dirname, fileName),
      `\n${data.index}. [${data.date}] : ${data.data} `,
      (err: any) => {
        if (err) console.log(err);
        console.log(data.index + '. ' + data.data + ' - added to log file');
      }
    );
    socket.emit('index', { index: data.index, status: 200 });
    index = data.index;
  } catch (err) {
    console.log(err);
    socket.emit('index', { index: index, status: 500 });
  }
});

// JSON Received
socket.on('json', (data: any) => {
  try {
    // Google search uses '+' instead of ' ' or '%20'
    const query = data.data.query.replace(/ /g, '+');
    const parameter = {
      q: query,
      google_domain: 'google.com'
    };

    const callback = function(body: any) {
      fs.appendFile(
        path.join(__dirname, fileName),
        `\n${data.index}. [${data.date}] : ${data.data.query} meets ${body.search_information.total_results} times`,
        (err: any) => {
          if (err) console.log(err);
          console.log(
            `${data.index}. ${data.data.query}(${body.search_information.total_results}) added to log file`
          );
        }
      );
      socket.emit('index', { index: data.index, status: 200 });
      index = data.index;
    };

    // Sending Request to Google search
    client.json(parameter, callback);
  } catch (err) {
    console.log(err);
    socket.emit('index', { index: index, status: 500 });
  }
});

// Master will disconnect randomly for 5 seconds
socket.on('connect', () => {
  const random = Math.floor(Math.random() * 10) * 300 + 10000;
  console.log(`Master will disconnect in ${random / 1000} seconds`);
  setTimeout(() => {
    socket.disconnect();
    setTimeout(() => {
      socket.connect();
    }, 5000);
  }, random);
});
