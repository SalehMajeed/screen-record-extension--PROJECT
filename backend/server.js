const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
};

app.use(cors(corsOptions));

let isRecording = false;
let videoChunks = [];

const io = socketIo(server, {
  cors: corsOptions,
});

io.on('connection', (socket) => {
  socket.on('startRecording', () => {
    isRecording = true;
    videoChunks = [];
  });

  socket.on('chunk', (chunk) => {
    if (isRecording) {
      videoChunks.push(chunk);
    }
  });

  socket.on('stopRecording', () => {
    if (isRecording) {
      isRecording = false;
      io.emit('videoData', videoChunks);
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
