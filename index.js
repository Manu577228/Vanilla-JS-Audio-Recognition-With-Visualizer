const startBtn = document.getElementById("start-btn");
const visualizer = document.getElementById("visualizer");
const transcript = document.getElementById("transcript");

// set the number of bars and colors for the visualizer
const bars = 50;
const colors = ["#8e44ad", "#000000", "#ffffff", "#ff0000"];

// create visualizer bars based on the number specified
for (let i = 0; i < bars; i++) {
  const bar = document.createElement("div");
  bar.style.width = `${100 / bars}%`;
  bar.style.backgroundColor = colors[i % colors.length];
  visualizer.appendChild(bar);
}

let audioCtx, analyser, microphone, javascriptNode;
let isSpeaking = false;

// Function to set up the audio context and related nodes
const setupAudioContext = () => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  javascriptNode = audioCtx.createScriptProcessor(2048, 1, 1);
};

// Function to start updating the visualizer based on audio input
const startVisualizer = () => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const updateVisualizer = () => {
    analyser.getByteFrequencyData(dataArray);
    let bars = visualizer.children;
    for (let i = 0; i < bars.length; i++) {
      const height = (dataArray[i] / 255) * 100;
      bars[i].style.height = `${height}%`;
    }
    if (isSpeaking) {
      requestAnimationFrame(updateVisualizer);
    }
  };
  updateVisualizer();
};

// Function to start speech recognition and update transcript
const startRecognition = () => {
  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isSpeaking = true;
    startVisualizer();
  };

  recognition.onend = () => {
    isSpeaking = false;
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript; // Corrected line
      }
    }
    transcript.textContent = finalTranscript || interimTranscript;
  };
  recognition.start();
};

// Event listener for the start button to begin audio processing & recognition
startBtn.addEventListener("click", () => {
  setupAudioContext();

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        microphone = audioCtx.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioCtx.destination);

        startRecognition();
      })
      .catch((err) => {
        console.log("The following gUM error occurred: " + err);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
});
