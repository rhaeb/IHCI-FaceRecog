let video = null;
let canvas = null;
let faceDescriptor = null;
let captureButton = null;
let messageDiv = null;
let stream = null; // Camera stream for stopping later

document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('overlay');
    captureButton = document.getElementById('capture-button');
    messageDiv = document.getElementById('message');

    // Initialize Face Recognition
    startFaceRecognition();

    // Handle Capture Button Click
    captureButton.addEventListener('click', () => {
        if (faceDescriptor) {
            console.log('Captured Face Descriptor:', faceDescriptor);
            const descriptorArray = Array.from(faceDescriptor).map(num => parseFloat(num.toFixed(6)));
            window.opener.receiveFaceDescriptor(descriptorArray); // Send to main window
            stopCamera();
            window.close();
        } else {
            messageDiv.textContent = 'No face detected. Please try again.';
        }
    });
});

async function startFaceRecognition() {
    try {
        console.log('Loading models...');
        await loadFaceApiModels();
        console.log('Models loaded successfully.');

        console.log('Accessing camera...');
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = stream;
        await video.play();

        // Update canvas size to match video dimensions
        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        };

        messageDiv.textContent = 'Looking for your face...';

        const displaySize = { width: video.clientWidth, height: video.clientHeight };
        faceapi.matchDimensions(canvas, displaySize);

        detectFace(displaySize);
    } catch (error) {
        console.error('Error initializing face recognition:', error);
        messageDiv.textContent = `Error: ${error.message}`;
    }
}

async function detectFace(displaySize) {
    const context = canvas.getContext('2d');
    const detectLoop = async () => {
        try {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.75 }))
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            if (detections.length === 1) {
                faceDescriptor = detections[0].descriptor;
                messageDiv.textContent = 'Face detected. You can capture your face.';
                captureButton.disabled = false;
            } else if (detections.length > 1) {
                messageDiv.textContent = 'Multiple faces detected. Please show only your face.';
                captureButton.disabled = true;
            } else {
                messageDiv.textContent = 'No face detected. Ensure your face is visible.';
                captureButton.disabled = true;
            }

            requestAnimationFrame(detectLoop);
        } catch (error) {
            console.error('Face detection error:', error);
            messageDiv.textContent = 'An error occurred during detection.';
        }
    };

    detectLoop();
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        console.log('Camera stopped.');
    }
}

async function loadFaceApiModels() {
    const modelUrl = '../models'; // Path to your models directory
    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
}
