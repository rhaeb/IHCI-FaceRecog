// Global faceData variable to hold the current face descriptor
let faceData = null;

async function startFaceRecognition() {
    // Load face-api.js models
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
  
        // Store face data if detections are found
        if (detections.length > 0) {
          faceData = detections[0].descriptor;
        }
      }, 100);
    });
  }

  // Function for Signup
  function handleSignup() {
    document.getElementById('signupForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('sEmail').value;
      const password = document.getElementById('sPassword').value;

      // Send face data along with user details to the backend for signup
      if (!faceData) {
        alert('Face data is missing. Please try again.');
        return;
      }

      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          email, 
          password, 
          faceData 
        })
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        if (data.message === 'User registered successfully') {
          // Optionally, redirect to login page after successful signup
          window.location.href = '/login';
        }
      })
      .catch(error => {
        console.error('Error during signup:', error);
        alert('There was an error during signup. Please try again.');
      });
    });
  }

  // Function for Login
  function handleLogin() {
    document.getElementById('loginForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('lEmail').value;
      const password = document.getElementById('lPassword').value;

      // Send face data along with email/password to the backend for login
      if (!faceData) {
        alert('Face data is missing. Please try again.');
        return;
      }

      fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          faceData 
        })
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
      })
      .catch(error => {
        console.error('Error during login:', error);
        alert('There was an error during login. Please try again.');
      });
    });
  }

  // Initialize Face Recognition
  startFaceRecognition();

  // Call the respective function based on the page
  if (document.getElementById('signupForm')) {
    handleSignup();  // Call signup handler if signup form is present
  }
  if (document.getElementById('loginForm')) {
    handleLogin();  // Call login handler if login form is present
  }
