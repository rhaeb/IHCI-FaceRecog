const faceData = detections[0].descriptor;
console.log(faceData); 
async function startFaceRecognition() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    
    const video = document.createElement('video');
    video.width = 640;
    video.height = 480;
  
    document.body.append(video);
  
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        video.srcObject = stream;
        video.play();
      });
  
    video.addEventListener('play', async () => {
      const canvas = faceapi.createCanvasFromMedia(video);
      document.body.append(canvas);
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);
  
      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video)
          .withFaceLandmarks()
          .withFaceDescriptors();
        canvas?.clear();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas?.drawDetections(resizedDetections);
  
        // Store face data for login
        if (detections.length > 0) {
          const faceData = detections[0].descriptor;
          document.getElementById('loginForm').addEventListener('submit', (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
  
            // Send face data along with email/password to the backend
            fetch('/api/users/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, faceData })
            })
            .then(response => response.json())
            .then(data => {
              alert(data.message);
              if (data.token) {
                localStorage.setItem('token', data.token);
              }
            });
          });
        }
      }, 100);
    });
  }
  
  startFaceRecognition();