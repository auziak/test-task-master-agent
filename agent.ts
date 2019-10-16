const app = require('http').createServer();
const io = require('socket.io')(app);
const fs = require('fs');
// Import data for sending
const dataArray = require('./data.json');

const PORT = process.env.port || 5000;

app.listen(PORT, () => console.log(`Server runnig on port ${PORT}`));

// console.log(dataArray);

// Function for converting image to binary file
function base64_encode(file: any | Buffer) {
  const bitmap = fs.readFileSync(file);
  const buffer = Buffer.from(bitmap);
  return buffer;
  // .toString('base64');
}

let myTimeOut: any;
let disconnectInt: any;
// Define index for data which will be sent
let x = 0;

io.on('connection', (socket: any) => {
  // Main function for sending data to master
  function sendData(arr: any) {
    if (!arr[x]) {
      console.log('No more data to send');
      return;
    } else {
      if (arr[x].type) {
        const date = new Date().toISOString();
        if (arr[x].type === 'image') {
          const base64str = base64_encode('./images/' + arr[x].imageName);
          io.emit('image', { data: base64str, index: x, date: date });
        } else if (arr[x].type === 'rawdata') {
          socket.emit('rawdata', { data: arr[x].data, index: x, date: date });
        } else if (arr[x].type === 'json') {
          socket.emit('json', { data: arr[x].data, index: x, date: date });
        } else {
          console.log('This type is not supported');
        }
      } else {
        console.log('Wrong format');
        x++;
        sendData(arr);
      }
    }
  }

  // Handle disconnect
  socket.on('disconnect', () => {
    clearTimeout(myTimeOut);
    disconnectInt = setInterval(() => {
      console.log('Connection Lost...');
    }, 1000);
  });

  // Recieving from master answer: which data should be sent next
  socket.on('index', (data: any) => {
    clearTimeout(myTimeOut);
    if (data.status === 200) {
      x = data.index + 1;
      myTimeOut = setTimeout(() => {
        sendData(dataArray);
      }, 2000);
    } else {
      x = data.index + 1;
      myTimeOut = setTimeout(() => {
        sendData(dataArray);
      }, 1000);
    }
  });

  // Clear disconnect message interval
  clearInterval(disconnectInt);
  // Send data when connection installed
  myTimeOut = setTimeout(() => {
    sendData(dataArray);
  }, 2000);
});
