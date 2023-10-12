const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const recordedVideo = document.getElementById('recordedVideo');
let mediaRecorder;

startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);

function combineStreams(audioStream, videoStream) {
  const combinedStream = new MediaStream();

  audioStream.getAudioTracks().forEach((track) => {
    combinedStream.addTrack(track);
  });

  videoStream.getVideoTracks().forEach((track) => {
    combinedStream.addTrack(track);
  });

  return combinedStream;
}

async function startRecording() {
  const audioStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  const videoStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
  });

  const combinedStream = combineStreams(audioStream, videoStream);

  mediaRecorder = new MediaRecorder(combinedStream);
  console.log(mediaRecorder);

  const socket = io.connect('http://localhost:3000');
  socket.emit('startRecording');

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      console.log(event);
      socket.emit('chunk', event.data);
    }
  };

  mediaRecorder.onstop = () => {
    stopRecording();
    socket.emit('stopRecording');
  };

  socket.on('videoData', async (chunkData) => {
    console.log('inside videData');
    const videoBlob = new Blob(chunkData, { type: 'video/mp4' });
    const videoFile = new File([videoBlob], 'demo.mp4', {
      type: 'video/mp4',
    });
    
    const formData = new FormData();
    formData.append('video', videoFile, videoFile.name);
    formData.append('source', window.location.host);
    
    console.log(videoFile);
    // const processFile = await fetch(
    //   'http://127.0.0.1:8000/storage/video-upload/',
    //   {
    //     method: 'POST',
    //     body: formData,
    //   }
    // );
    // const responseFile = await processFile.json();
    recordedVideo.src = URL.createObjectURL(videoBlob);
    recordedVideo.controls = true;
  });

  mediaRecorder.start(1000);
  startButton.disabled = true;
  stopButton.disabled = false;
}

function stopRecording() {
  mediaRecorder.stop();
  startButton.disabled = false;
  stopButton.disabled = true;
}