let faceDescriptor = null;
let video = null;
let canvas = null;

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    setupPageLogic(currentPage);
});

function setupPageLogic(currentPage) {
    if (currentPage === 'signuptest.html') {
        const signupForm = document.getElementById('signupForm');
        signupForm.addEventListener('submit', handleSignup);
    } else if (currentPage === 'logintest.html') {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    console.log('script.js');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;

    if (!username || !password || !firstName || !lastName) {
        showMessage('All fields are required.');
        return;
    }

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, firstName, lastName })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('User registered. Starting face recognition...');
            startFaceRecognition('register', username);
        } else {
            showMessage(data.message);
        }
    } catch (error) {
        console.error('Error registering:', error);
        showMessage('Error registering user');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;

    if (!username) {
        showMessage('Username is required.');
        return;
    }

    showMessage('Starting face recognition...');
    startFaceRecognition('login', username);
}

async function startFaceRecognition(mode, username) {
  const container = document.querySelector('.container');
  
  // Remove existing video and canvas if they exist
  if (video) video.remove();
  if (canvas) canvas.remove();
  
  video = document.createElement('video');
  canvas = document.createElement('canvas');
  video.width = 640;
  video.height = 480;
  canvas.width = 640;
  canvas.height = 480;
  container.appendChild(video);
  container.appendChild(canvas);

  try {
      await loadFaceApiModels();
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      console.log('Camera stream obtained');
      video.srcObject = stream;
      await video.play();

      // Wait for video to load before starting detection
      video.onloadeddata = async () => {
          if (video.paused || video.ended) {
              video.play(); // Make sure video starts playing
          }
          console.log('Video data loaded');
          const displaySize = { width: video.width, height: video.height };
          faceapi.matchDimensions(canvas, displaySize);

          // Ensure canvas is correctly drawn
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);  // Clear canvas before drawing

          const detectFace = async () => {
              const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
                  inputSize: 320,  // Increase size for better detection
                  scoreThreshold: 0.3  // Lower the threshold for more sensitive detection
              }))
              .withFaceLandmarks()
              .withFaceDescriptors();

              console.log('Raw detections:', detections); // Log detections directly

              const resizedDetections = faceapi.resizeResults(detections, displaySize);
              faceapi.draw.drawDetections(canvas, resizedDetections);
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

              if (detections.length > 0) {
                  const faceDescriptor = detections[0].descriptor;
                  console.log('Face descriptor:', faceDescriptor); // Log face descriptor

                  if (!faceDescriptor) {
                      console.log('No face detected. Please make sure your face is visible.');
                      showMessage('No face detected. Please make sure your face is visible.');
                      return;
                  }

                  try {
                      if (mode === 'register') {
                          await registerFace(username);
                      } else if (mode === 'login') {
                          await loginWithFace(username);
                      }
                  } catch (error) {
                      console.error('Error during face recognition:', error);
                      showMessage('Error during face recognition');
                  }
                  return; // Exit the function after processing the face
              }

              // Continue detecting faces if none found
              requestAnimationFrame(detectFace);
          };

          detectFace();
      };
  } catch (error) {
      console.error('Error accessing camera:', error);
      showMessage('Error accessing camera');
  }
}

async function loadFaceApiModels() {
  try {
      console.log('Loading face-api models...');
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      console.log('Face-api models loaded successfully.');
  } catch (err) {
      console.error('Error loading models:', err);
      showMessage('Error loading face-api models. Ensure the models are located in the correct path.');
  }
}

async function registerFace(username) {
    if (!faceDescriptor) {
        showMessage('No face detected. Please make sure your face is visible.');
        return;
    }

    const faceData = {
        username: username,
        faceDescriptor: Array.from(faceDescriptor)
    };

    console.log('Sending data:', faceData);

    try {
        const response = await fetch('/api/users/register-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faceData)
        });

        const data = await response.json();
        showMessage(data.message);

        if (response.ok) {
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 2000);
        }
    } catch (error) {
        console.error('Error registering face:', error);
        showMessage('Error registering face');
    }
}

async function loginWithFace(username) {
    if (!faceDescriptor) {
        showMessage('No face detected. Please make sure your face is visible.');
        return;
    }

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, faceDescriptor: Array.from(faceDescriptor) })
        });

        const data = await response.json();
        showMessage(data.message);
        if (response.ok) {
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 2000);
        }
    } catch (error) {
        console.error('Error logging in:', error);
        showMessage('Error logging in');
    }
}

function showMessage(message) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
}
