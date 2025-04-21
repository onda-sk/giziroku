let socket = null;
let currentMeetingId = null;
let minutesDiv = document.getElementById("minutes");
let stopBtn = document.getElementById("stop-btn");

document.getElementById("connect-btn").onclick = function() {
    const meetingId = document.getElementById("meeting-id-input").value.trim();
    if (!meetingId) {
        alert("会議IDを入力してください");
        return;
    }
    connectToMeeting(meetingId);
};

function connectToMeeting(meetingId) {
    if (socket) {
        socket.disconnect();
    }
    socket = io({ path: "/rtmmg/socket" });
    socket.emit("join", { meeting_id: meetingId });
    currentMeetingId = meetingId;
    stopBtn.style.display = "";
    minutesDiv.textContent = "接続中...";
    fetchMinutes();
    socket.on("minutes_update", (data) => {
        minutesDiv.textContent = data.minutes;
    });
}

stopBtn.onclick = function() {
    if (socket && currentMeetingId) {
        socket.emit("end_meeting", { meeting_id: currentMeetingId });
        socket.disconnect();
        minutesDiv.textContent = "議事録を停止しました。";
        stopBtn.style.display = "none";
    }
};

// 10秒ごとにminutes取得
function fetchMinutes() {
    if (!currentMeetingId) return;
    fetch("/rtmmg/api/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: currentMeetingId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.minutes !== undefined) {
            minutesDiv.textContent = data.minutes;
        }
    });
    setTimeout(fetchMinutes, 10000);
}

// オプションパネルの開閉
const optionsToggle = document.getElementById("options-toggle");
const optionsPanel = document.getElementById("options-panel");
optionsToggle.onclick = function() {
    optionsPanel.classList.toggle("open");
    optionsToggle.textContent = optionsPanel.classList.contains("open") ? "▲ オプション" : "▼ オプション";
};

// オプション保存
document.getElementById("save-options-btn").onclick = function() {
    const prompt = document.getElementById("opt-prompt").value;
    if (currentMeetingId && prompt) {
        fetch("/rtmmg/api/prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meeting_id: currentMeetingId, prompt: prompt })
        });
    }
    optionsPanel.classList.remove("open");
    optionsToggle.textContent = "▼ オプション";
};
