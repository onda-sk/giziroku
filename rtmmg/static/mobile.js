const meetingId = window.MEETING_ID;
const socket = io({ path: "/rtmmg/socket" });

let recognition;
let recognizing = false;
let paused = false;

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const statusDiv = document.getElementById("status");
const recognizedDiv = document.getElementById("recognized");

function updateStatus(msg) {
    statusDiv.textContent = msg;
}

function setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => updateStatus("録音中...");
    recognition.onend = () => {
        if (recognizing && !paused) {
            recognition.start();
        } else {
            updateStatus("停止しました");
        }
    };
    recognition.onerror = (e) => updateStatus("エラー: " + e.error);

    recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        recognizedDiv.textContent = finalTranscript + interimTranscript;
        if (finalTranscript) {
            socket.emit("transcript", { meeting_id: meetingId, text: finalTranscript });
        }
    };
}

startBtn.onclick = () => {
    if (!recognizing) {
        if (!recognition) setupRecognition();
        recognizing = true;
        paused = false;
        recognition.start();
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        updateStatus("録音中...");
        socket.emit("join", { meeting_id: meetingId });
    }
};

pauseBtn.onclick = () => {
    if (recognizing && !paused) {
        paused = true;
        recognition.stop();
        updateStatus("一時停止中");
        pauseBtn.textContent = "再開";
    } else if (recognizing && paused) {
        paused = false;
        recognition.start();
        updateStatus("録音中...");
        pauseBtn.textContent = "一時停止";
    }
};

stopBtn.onclick = () => {
    if (recognizing) {
        recognizing = false;
        paused = false;
        recognition.stop();
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        updateStatus("停止しました");
        socket.emit("end_meeting", { meeting_id: meetingId });
    }
};
