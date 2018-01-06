var mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;

// Initialize web elements
var gumVideo      = document.querySelector('video#gum');
var recordedVideo = document.querySelector('video#recorded');

var recordButton  = document.querySelector('button#record');
var playButton    = document.querySelector('button#play');
var downloadButton= document.querySelector('button#download');
var uploadButton  = document.querySelector('button#sendToServer');

// Setup onclick methods (this can also be added by onclick directly on html)
recordButton.onclick = toggleRecording;
playButton.onclick = play;
downloadButton.onclick = download;
uploadButton.onclick = uploadServer;

var isSecureOrigin = location.protocol === 'https:' ||
location.hostname === 'localhost';
if (!isSecureOrigin) {
  alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
    '\n\nChanging protocol to HTTPS');
  location.protocol = 'HTTPS';
}

// Constraints of video recording
var constraints = {
  audio: true,
  video: { width: 1080, height: 720 }
};

navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);

// If camera was correctly selected
function handleSuccess(stream) {
  recordButton.disabled = false;
  window.stream = stream;
  gumVideo.srcObject = stream;
}

// If camera it wasn't
function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}


function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

// Record video needs a listener, because event stop, pause, etc
recordedVideo.addEventListener('error', function(ev) {
  console.error('MediaRecording.recordedMedia.error()');
  alert('Your browser can not play\n\n' + recordedVideo.src
    + '\n\n media clip. event: ' + JSON.stringify(ev));
}, true);

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

// Scalability
function handleStop(event) {
  console.log('Recorder stopped: ', event);
}

// This function handles the video recording, web elements changes to notify user
function toggleRecording() {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
    uploadButton.disabled = false;
  }
}

// Functions that loads the recording configuration
function startRecording() {
  recordedBlobs = [];
  var options = {mimeType: 'video/webm;codecs=vp9'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.log(options.mimeType + ' is not Supported');
    options = {mimeType: 'video/webm;codecs=vp8'};    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = {mimeType: 'video/webm'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: ''};
      }
    }
  }
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder: ' + e);
    alert('Exception while creating MediaRecorder: '
      + e + '. mimeType: ' + options.mimeType);
    return;
  }
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  uploadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  recordedVideo.controls = true;
}

// Handles playing recorded video
function play() {
  var superBuffer = new Blob(recordedBlobs, {type: 'video/mp4'});
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.addEventListener('loadedmetadata', function() {
    if (recordedVideo.duration === Infinity) {
      recordedVideo.currentTime = 1e101;
      recordedVideo.ontimeupdate = function() {
        recordedVideo.currentTime = 0;
        recordedVideo.ontimeupdate = function() {
          delete recordedVideo.ontimeupdate;
          recordedVideo.play();
        };
      };
    }
  });
}

// This function uploads the recorded video to the server
function uploadServer() {

  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
  var APIurl = "http:127.0.0.1:5000/api/file";
  var name = "videoTesting.mp4";

  var data = new FormData();
  data.append('userVideo', blob);
  
  $.ajax({
    url :  APIurl,
    type: 'POST',
    data: data,
    contentType: false,
    processData: false,
    mimeType: "multipart/form-data",
    success: function(data) {
      console.log("yei");
    },    
    error: function(error) {
      console.log("error");
      console.log(error);
    }
  });
  
}

// This function is executed when download button is pressed, downloads the video
function download() {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});

  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}