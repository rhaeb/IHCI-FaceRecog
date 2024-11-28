const pool = require('./db'); // Import your db.js file
window.onload = () => {
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('./models')
    ]).then(startVideo);
  };
  
  function startVideo() {
    const video = document.getElementById('video');
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
        // Call getFaceDescriptor every 2 seconds
        setInterval(getFaceDescriptor, 2000);
      })
      .catch((err) => {
        console.error('Error accessing webcam: ', err);
      });
  }
  
  async function getFaceDescriptor() {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  
    if (detections) {
      console.log(detections.descriptor); // Face descriptor logged to console
    } else {
      console.log("No face detected");
    }
  }
  