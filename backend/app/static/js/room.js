// ==========================================================
// Authentication
// ==========================================================

const token = getToken();

if (!token) {
    window.location.replace("/");
    throw new Error("Authentication required");
}

// ==========================================================
// Room Information
// ==========================================================

const params = new URLSearchParams(window.location.search);
const roomCode = params.get("room");

if (!roomCode) {
    alert("Invalid room.");
    window.location.href = "/dashboard";
    throw new Error("Room code missing");
}

// ==========================================================
// Global Variables
// ==========================================================

let editor = null;
let socket = null;

let currentUser = null;
let onlineUsers = [];
let currentFile = null;
let selectedFile = null;

const fileModels = {};

let remoteUpdate = false;
let typingTimer = null;

// ==========================================================
// Meeting Variables
// ==========================================================

let localStream = null;
let screenStream = null;

let cameraEnabled = true;
let micEnabled = true;
const peerConnections = {};
// ==========================================================
// AI Meeting Transcript
// ==========================================================

let meetingTranscript = "";
let speechRecognition = null;
let recognitionRunning = false;

const rtcConfig = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

// ==========================================================
// UI
// ==========================================================

const roomTitle = document.getElementById("roomTitle");

if (roomTitle) {
    roomTitle.textContent = `Room : ${roomCode}`;
}

// ==========================================================
// Language Mapping
// ==========================================================

function getLanguage(language) {

    switch ((language || "").toLowerCase()) {

        case "python":
            return "python";

        case "javascript":
        case "js":
            return "javascript";

        case "cpp":
        case "c++":
            return "cpp";

        case "java":
            return "java";

        case "html":
            return "html";

        case "css":
            return "css";

        case "json":
            return "json";

        case "typescript":
        case "ts":
            return "typescript";

        default:
            return "plaintext";
    }
}

// ==========================================================
// Copy Room Code
// ==========================================================

const copyRoomBtn = document.getElementById("copyRoomCode");

if (copyRoomBtn) {

    copyRoomBtn.onclick = async () => {

        try {

            await navigator.clipboard.writeText(roomCode);

            alert("Room code copied.");

        }

        catch (err) {

            console.error(err);

            alert("Unable to copy room code.");

        }

    };

}

// ==========================================================
// File Explorer
// ==========================================================

async function loadFiles() {

    try {

        const response = await fetch(`${API_BASE}/files/${roomCode}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok)
            throw new Error("Unable to load files.");

        const files = await response.json();

        const explorer = document.getElementById("fileExplorer");

        explorer.innerHTML = "";

        for (const file of files) {

            const item = document.createElement("div");

            item.className =
                "flex justify-between items-center p-3 border-b border-slate-700 hover:bg-slate-700";

            const left = document.createElement("div");

            left.className = "cursor-pointer flex-1";

            left.textContent = "📄 " + file.filename;

            left.onclick = async () => {

                await openFile(file.id);

            };

            const menu = document.createElement("button");

            menu.innerHTML = "⋮";

            menu.className =
                "text-xl font-bold px-2 hover:text-blue-400";

            menu.onclick = (e) => {

                e.stopPropagation();

                showFileMenu(file, e);

            };

            item.appendChild(left);
            item.appendChild(menu);

            explorer.appendChild(item);

        }

        if (files.length > 0) {

            await openFile(files[0].id);

        } else {

            currentFile = null;

            if (editor)
                editor.setValue("");

        }

    }

    catch (err) {

        console.error(err);

        alert("Unable to load files.");

    }

}

// ==========================================================
// Open File
// ==========================================================

async function openFile(fileId) {

    try {

        const response = await fetch(
            `${API_BASE}/files/content/${fileId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok)
            throw new Error("Unable to open file.");

        const file = await response.json();

        currentFile = file;

        if (!fileModels[file.id]) {

            fileModels[file.id] = monaco.editor.createModel(
                file.content,
                getLanguage(file.language)
            );

        }

        if (editor) {

            editor.setModel(fileModels[file.id]);

        }

    }

    catch (err) {

        console.error(err);

        alert("Unable to open file.");

    }

}

// ==========================================================
// Monaco Editor
// ==========================================================

require.config({
    paths: {
        vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"
    }
});

require(
    ["vs/editor/editor.main"],
    async function () {

        editor = monaco.editor.create(
            document.getElementById("editor"),
            {
                value: "",
                language: "python",
                theme: "vs",
                automaticLayout: true,
                fontSize: 16,
                minimap: {
                    enabled: true
                }
            }
        );

        editor.onDidChangeModelContent(() => {

            if (remoteUpdate)
                return;

            if (!currentFile)
                return;

            clearTimeout(typingTimer);

            typingTimer = setTimeout(() => {

                if (!socket)
                    return;

                if (socket.readyState !== WebSocket.OPEN)
                    return;

                socket.send(JSON.stringify({

                    type: "editor_update",

                    data: {

                        file_id: currentFile.id,

                        content: editor.getValue()

                    }

                }));

            }, 250);

        });

        await loadFiles();

        connectSocket();

    }
);

// ==========================================================
// WebSocket
// ==========================================================

function connectSocket() {

    socket = new WebSocket(
        `${WS_BASE}/ws/${roomCode}?token=${token}`
    );

    socket.onopen = () => {

        console.log("Connected");

    };

    socket.onclose = () => {

        console.log("Disconnected");

        setTimeout(connectSocket, 3000);

    };

    socket.onerror = (err) => {

        console.error(err);

    };

    socket.onmessage = handleSocketMessage;

}

// ==========================================================
// Handle Incoming Messages
// ==========================================================

function handleSocketMessage(event) {

    let msg;

    try {

        msg = JSON.parse(event.data);

    }

    catch (err) {

        console.error("Invalid WebSocket message:", err);

        return;

    }

    console.log(msg);

    switch (msg.type) {

        // -----------------------
        // Initial Document
        // -----------------------

        case "load_document":
            break;

        // -----------------------
        // Live Editor Update
        // -----------------------

        case "editor_update":

            if (!currentFile)
                break;

            if (msg.data.file_id !== currentFile.id)
                break;

            if (editor.getValue() === msg.data.content)
                break;

            remoteUpdate = true;

            editor.executeEdits("", [
                {
                    range: editor.getModel().getFullModelRange(),
                    text: msg.data.content
                }
            ]);

            remoteUpdate = false;

            break;

        // -----------------------
        // Chat
        // -----------------------

        case "chat_message":

            appendChatMessage(
                msg.sender.name,
                msg.data.message,
                "text-blue-400"
            );

            break;
         // -----------------------
        // User Joined
        // -----------------------

        case "user_joined":

            appendSystemMessage(
                `${msg.user?.name || "A user"} joined.`,
                "text-green-400"
            );

            break;

        // -----------------------
        // User Left
        // -----------------------

        case "user_left":

            appendSystemMessage(
                `${msg.user?.name || "A user"} left.`,
                "text-red-400"
            );

            break;

        // -----------------------
        // Online Users
        // -----------------------

        case "online_users":

    if (msg.current_user) {
        currentUser = msg.current_user;
    }

    onlineUsers = Array.isArray(msg.users)
        ? msg.users
        : [];

    onOnlineUsers(onlineUsers);

    break;
        // -----------------------
        // Video Offer
        // -----------------------

        case "video_offer":

            handleOffer(
                msg.sender.id,
                msg.offer
            );

            break;

        // -----------------------
        // Video Answer
        // -----------------------

        case "video_answer":

            handleAnswer(
                msg.sender.id,
                msg.answer
            );

            break;

        // -----------------------
        // ICE Candidate
        // -----------------------

        case "ice_candidate":

            handleIceCandidate(
                msg.sender.id,
                msg.candidate
            );

            break;

    }

}

// ==========================================================
// Online Users
// ==========================================================

function renderOnlineUsers(users) {

    const container = document.getElementById("onlineUsers");

    if (!container)
        return;

    container.innerHTML = "";

    users.forEach(user => {

        const div = document.createElement("div");

        div.className =
            "flex items-center gap-2 py-2 border-b border-slate-700";

        div.innerHTML = `
            <span class="text-green-500">🟢</span>
            <span>${user.name}</span>
        `;

        container.appendChild(div);

    });
}

// ==========================================================
// Chat Helpers
// ==========================================================

function appendChatMessage(name, message, color) {

    const chat = document.getElementById("chatMessages");

    if (!chat)
        return;

    const div = document.createElement("div");

    div.className = "mb-3";

    div.innerHTML = `
        <div class="font-bold ${color}">
            ${name}
        </div>

        <div class="break-words whitespace-pre-wrap">
            ${message}
        </div>
    `;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;

}

function appendSystemMessage(message, color) {

    const chat = document.getElementById("chatMessages");

    if (!chat)
        return;

    const div = document.createElement("div");

    div.className = `${color} italic mb-2`;

    div.textContent = message;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;

}

// ==========================================================
// Send Chat
// ==========================================================

document.getElementById("sendBtn").onclick = () => {

    if (!socket || socket.readyState !== WebSocket.OPEN) {

        alert("Connection lost.");

        return;

    }

    const input = document.getElementById("chatInput");

    const message = input.value.trim();

    if (!message)
        return;

    socket.send(JSON.stringify({

        type: "chat_message",

        data: {
            message
        }

    }));

    input.value = "";

};

document.getElementById("chatInput").addEventListener("keypress", function (e) {

    if (e.key === "Enter") {

        e.preventDefault();

        document.getElementById("sendBtn").click();

    }

});

// ==========================================================
// Save File
// ==========================================================

document.getElementById("saveBtn").onclick = async () => {

    if (!currentFile || !editor) {

        alert("No file selected.");

        return;

    }

    try {

        const response = await fetch(
            `${API_BASE}/files/update/${currentFile.id}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: editor.getValue()
                })
            }
        );

        if (!response.ok)
            throw new Error();

        alert("Saved Successfully.");

    }

    catch (err) {

        console.error(err);

        alert("Unable to save file.");

    }

};

// ==========================================================
// Download File
// ==========================================================

document.getElementById("downloadBtn").onclick = () => {

    if (!currentFile || !editor)
        return;

    const blob = new Blob(
        [editor.getValue()],
        {
            type: "text/plain"
        }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = currentFile.filename;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

};

// ==========================================================
// Create File
// ==========================================================

const modal = document.getElementById("newFileModal");
const filenameInput = document.getElementById("newFileName");

const languageMap = {
    py: "python",
    js: "javascript",
    cpp: "cpp",
    c: "c",
    java: "java",
    html: "html",
    css: "css",
    json: "json",
    ts: "typescript"
};

document.getElementById("newFileBtn").onclick = () => {

    filenameInput.value = "";

    modal.classList.remove("hidden");

    filenameInput.focus();

};

document.getElementById("cancelFileBtn").onclick = () => {

    modal.classList.add("hidden");

};

document.getElementById("createFileBtn").onclick = async () => {

    const filename = filenameInput.value.trim();

    if (!filename) {

        alert("Enter filename.");

        return;

    }

    const ext = filename.includes(".")
        ? filename.split(".").pop().toLowerCase()
        : "";

    const language = languageMap[ext] || "plaintext";

    try {

        const response = await fetch(
            `${API_BASE}/files/create`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    room_code: roomCode,
                    filename,
                    language
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.detail || "Unable to create file.");

            return;

        }

        modal.classList.add("hidden");

        await loadFiles();

    }

    catch (err) {

        console.error(err);

        alert("Unable to create file.");

    }

};

// ==========================================================
// File Menu
// ==========================================================

function showFileMenu(file, event) {

    event.stopPropagation();

    selectedFile = file;

    const menu = document.getElementById("fileMenu");

    if (!menu)
        return;

    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;

    menu.classList.remove("hidden");

}

// ==========================================================
// Rename File
// ==========================================================

async function renameFile(file) {

    if (!file)
        return;

    const filename = window.prompt(
        "New filename:",
        file.filename
    );

    if (!filename || filename.trim() === "")
        return;

    try {

        const response = await fetch(
            `${API_BASE}/files/rename/${file.id}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filename: filename.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.detail || "Rename failed.");

            return;

        }

        await loadFiles();

    }

    catch (err) {

        console.error(err);

        alert("Rename failed.");

    }

}

// ==========================================================
// Delete File
// ==========================================================

async function deleteFile(file) {

    if (!file)
        return;

    if (!confirm(`Delete ${file.filename}?`))
        return;

    try {

        const response = await fetch(
            `${API_BASE}/files/delete/${file.id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.detail || "Delete failed.");

            return;

        }

        currentFile = null;

        await loadFiles();

    }

    catch (err) {

        console.error(err);

        alert("Delete failed.");

    }

}

// ==========================================================
// Run Program
// ==========================================================

document.getElementById("runBtn").onclick = runProgram;

async function runProgram() {

    if (!currentFile || !editor) {

        alert("No file selected.");

        return;

    }

    const terminal = document.getElementById("terminalOutput");

    terminal.textContent = "Running...\n";

    try {

        const response = await fetch(
            `${API_BASE}/execute/run`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: currentFile.language,
                    code: editor.getValue()
                })
            }
        );

        const result = await response.json();

        terminal.textContent = "";

        if (result.stdout)
            terminal.textContent += result.stdout;

        if (result.stderr)
            terminal.textContent += result.stderr;

        terminal.textContent += `\n\nExit Code : ${result.exit_code}`;

    }

    catch (err) {

        console.error(err);

        terminal.textContent = "Execution Failed.";

    }

}

// ==========================================================
// Exit Room
// ==========================================================

function cleanupResources() {

    if (localStream)
        localStream.getTracks().forEach(track => track.stop());

    if (screenStream)
        screenStream.getTracks().forEach(track => track.stop());

    if (socket)
        socket.close();

}

document.getElementById("exitBtn").onclick = () => {

    cleanupResources();

    window.location.href = "/dashboard";

};

window.addEventListener("beforeunload", cleanupResources);

// ==========================================================
// File Menu Events
// ==========================================================

document.addEventListener("click", () => {

    const menu = document.getElementById("fileMenu");

    if (menu)
        menu.classList.add("hidden");

});

document.getElementById("renameFileBtn").onclick = () => {

    document.getElementById("fileMenu").classList.add("hidden");

    renameFile(selectedFile);

};

document.getElementById("deleteFileBtn").onclick = () => {

    document.getElementById("fileMenu").classList.add("hidden");

    deleteFile(selectedFile);

};

// ==========================================================
// Chat / AI Tabs
// ==========================================================

const chatTab = document.getElementById("chatTab");
const aiTab = document.getElementById("aiTab");

const chatPanel = document.getElementById("chatPanel");
const aiPanel = document.getElementById("aiPanel");

chatTab.onclick = () => {

    chatPanel.classList.remove("hidden");
    aiPanel.classList.add("hidden");

    chatTab.classList.add("bg-slate-700");
    aiTab.classList.remove("bg-slate-700");

};

aiTab.onclick = () => {

    aiPanel.classList.remove("hidden");
    chatPanel.classList.add("hidden");

    aiTab.classList.add("bg-slate-700");
    chatTab.classList.remove("bg-slate-700");

};

// ==========================================================
// Explain Selected Code
// ==========================================================

document.getElementById("explainBtn").onclick = explainSelectedCode;

async function explainSelectedCode() {

    if (!currentFile || !editor)
        return;

    let code = editor.getModel().getValueInRange(
        editor.getSelection()
    );

    if (!code.trim()) {
        code = editor.getValue();
    }

    try {

        const response = await fetch(
            `${API_BASE}/ai/explain`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: currentFile.language,
                    code
                })
            }
        );

        const data = await response.json();

        document.getElementById("aiResponse").textContent =
            data.explanation || "No explanation returned.";

    }

    catch (err) {

        console.error(err);

        document.getElementById("aiResponse").textContent =
            "Unable to generate explanation.";

    }

}
// ==========================================================
// AI Autocomplete
// ==========================================================

document.getElementById("autocompleteBtn").onclick = autocompleteCode;

async function autocompleteCode() {

    if (!currentFile || !editor) {
        alert("Open a file first.");
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/ai/autocomplete`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: currentFile.language,
                    code: editor.getValue()
                })
            }
        );

        const data = await response.json();

        if (!response.ok)
            throw new Error(data.detail || "Autocomplete failed.");

        editor.executeEdits("", [{
            range: editor.getSelection(),
            text: data.completion || ""
        }]);

        editor.focus();

    }

    catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// ==========================================================
// AI Generate
// ==========================================================

document.getElementById("generateBtn").onclick = generateCode;

async function generateCode() {

    if (!editor)
        return;

    const prompt = document
        .getElementById("generatePrompt")
        .value
        .trim();

    if (!prompt) {

        alert("Enter a prompt.");

        return;

    }

    try {

        const response = await fetch(
            `${API_BASE}/ai/generate`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({

                    language: currentFile
                        ? currentFile.language
                        : "python",

                    prompt

                })
            }
        );

        const data = await response.json();

        if (!response.ok)
            throw new Error(data.detail || "Generation failed.");

        editor.setValue(data.code || "");

    }

    catch (err) {

        console.error(err);

        alert(err.message);

    }

}

// ==========================================================
// START CAMERA
// ==========================================================

async function startCamera() {

    if (localStream)
        return;

    try {

        localStream = await navigator.mediaDevices.getUserMedia({

            video: true,
            audio: true

        });

        const localVideo =
            document.getElementById("localVideo");

        if (localVideo) {

            localVideo.srcObject = localStream;
            localVideo.muted = true;
            localVideo.play();

        }

        document
            .getElementById("meetingArea")
            .classList.remove("hidden");

        //--------------------------------------------------
        // Add tracks to all existing peer connections
        //--------------------------------------------------

        Object.entries(peerConnections).forEach(([id, pc]) => {

            localStream.getTracks().forEach(track => {

                const alreadyExists = pc.getSenders().some(sender =>

                    sender.track &&
                    sender.track.kind === track.kind

                );

                if (!alreadyExists) {

                    pc.addTrack(track, localStream);

                }

            });

        });

        //--------------------------------------------------
        // Create offers AFTER camera starts
        //--------------------------------------------------

        if (Array.isArray(onlineUsers) && onlineUsers.length > 0) {
    console.log("onlineUsers =", onlineUsers);
    console.log("Array?", Array.isArray(onlineUsers));
    console.log("Type =", typeof onlineUsers);
    startVideoCalls(onlineUsers);

}

        startSpeechRecognition();
        console.log("Camera Started");

    }

    catch (err) {

        console.error(err);

        alert("Unable to access camera/microphone.");

    }

}



// ==========================================================
// CAMERA BUTTON
// ==========================================================

document
    .getElementById("cameraBtn")
    .onclick = async () => {

    if (!localStream) {

        await startCamera();

        return;

    }

    cameraEnabled = !cameraEnabled;

    localStream
        .getVideoTracks()
        .forEach(track => {

            track.enabled = cameraEnabled;

        });

    document
        .getElementById("cameraBtn")
        .textContent =

        cameraEnabled

            ? "📹 Camera"

            : "🚫 Camera";

};



// ==========================================================
// MICROPHONE BUTTON
// ==========================================================

document
    .getElementById("micBtn")
    .onclick = () => {

    if (!localStream) {

        alert("Start Camera First");

        return;

    }

    micEnabled = !micEnabled;

    localStream
        .getAudioTracks()
        .forEach(track => {

            track.enabled = micEnabled;

        });

    document
        .getElementById("micBtn")
        .textContent =

        micEnabled

            ? "🎤 Mic"

            : "🔇 Muted";

};



// ==========================================================
// SCREEN SHARE
// ==========================================================

document
    .getElementById("shareScreenBtn")
    .onclick = async () => {

    try {

        screenStream =

            await navigator
                .mediaDevices
                .getDisplayMedia({

                    video: true

                });

        const screenVideo =
            document.getElementById("screenVideo");

        screenVideo.srcObject = screenStream;

        document
            .getElementById("screenShareContainer")
            .classList.remove("hidden");

        const screenTrack =
            screenStream.getVideoTracks()[0];

        //--------------------------------------------------
        // Replace outgoing camera track
        //--------------------------------------------------

        Object.values(peerConnections).forEach(pc => {

            const sender =

                pc.getSenders().find(sender =>

                    sender.track &&
                    sender.track.kind === "video"

                );

            if (sender) {

                sender.replaceTrack(screenTrack);

            }

        });

        //--------------------------------------------------
        // Stop sharing
        //--------------------------------------------------

        screenTrack.onended = async () => {

            document
                .getElementById("screenShareContainer")
                .classList.add("hidden");

            screenVideo.srcObject = null;

            if (!localStream)
                return;

            const cameraTrack =

                localStream.getVideoTracks()[0];

            Object.values(peerConnections).forEach(pc => {

                const sender =

                    pc.getSenders().find(sender =>

                        sender.track &&
                        sender.track.kind === "video"

                    );

                if (sender) {

                    sender.replaceTrack(cameraTrack);

                }

            });

        };

    }

    catch (err) {

        console.error(err);

    }

};
// ==========================================================
// CREATE PEER CONNECTION
// ==========================================================

function createPeerConnection(userId) {

    //--------------------------------------------------
    // Reuse existing connection
    //--------------------------------------------------

    if (peerConnections[userId]) {

        return peerConnections[userId];

    }

    console.log("Creating Peer Connection ->", userId);

    const pc = new RTCPeerConnection(rtcConfig);

    peerConnections[userId] = pc;

    //--------------------------------------------------
    // Add local media
    //--------------------------------------------------

    if (localStream) {

        localStream.getTracks().forEach(track => {

            const alreadyAdded = pc.getSenders().some(sender =>

                sender.track &&
                sender.track.kind === track.kind

            );

            if (!alreadyAdded) {

                pc.addTrack(track, localStream);

            }

        });

    }

    //--------------------------------------------------
    // ICE Candidate
    //--------------------------------------------------

    pc.onicecandidate = event => {

        if (!event.candidate)
            return;

        socket.send(JSON.stringify({

            type: "ice_candidate",

            target_user_id: userId,

            candidate: event.candidate

        }));

    };

    //--------------------------------------------------
    // Remote Stream
    //--------------------------------------------------

    pc.ontrack = (event) => {

    console.log("========= TRACK RECEIVED =========");
    console.log("User:", userId);
    console.log("Streams:", event.streams);

    let video = document.getElementById("remote-" + userId);

    if (!video) {

        video = document.createElement("video");

        video.id = "remote-" + userId;

        video.autoplay = true;

        video.playsInline = true;

        video.controls = false;

        document
            .getElementById("remoteVideos")
            .appendChild(video);

    }

    video.srcObject = event.streams[0];

    video.onloadedmetadata = () => {

        console.log("Playing remote video");

        video.play();

    };

};
    //--------------------------------------------------
    // Negotiation Needed
    //--------------------------------------------------
/*
    pc.onnegotiationneeded = async () => {

        try {

            if (!localStream)
                return;

            console.log("Negotiation Needed ->", userId);

            await createOffer(userId);

        }

        catch (err) {

            console.error(err);

        }

    };
*/
    //--------------------------------------------------
    // ICE Connection State
    //--------------------------------------------------

    pc.oniceconnectionstatechange = () => {

        console.log(

            "ICE State",

            userId,

            pc.iceConnectionState

        );

        if (

            pc.iceConnectionState === "failed" ||

            pc.iceConnectionState === "closed" ||

            pc.iceConnectionState === "disconnected"

        ) {

            removeRemoteVideo(userId);

        }

    };

    //--------------------------------------------------
    // Connection State
    //--------------------------------------------------

    pc.onconnectionstatechange = () => {

        console.log(

            "Peer State",

            userId,

            pc.connectionState

        );

        if (

            pc.connectionState === "failed" ||

            pc.connectionState === "closed"

        ) {

            removeRemoteVideo(userId);

        }

    };

    return pc;

}



// ==========================================================
// REMOVE REMOTE VIDEO
// ==========================================================

function removeRemoteVideo(userId) {

    const video = document.getElementById(

        "remote-" + userId

    );

    if (video) {

        video.srcObject = null;

        video.remove();

    }

    if (peerConnections[userId]) {

        peerConnections[userId].close();

        delete peerConnections[userId];

    }

}



// ==========================================================
// CLOSE ALL PEER CONNECTIONS
// ==========================================================

function closeAllPeerConnections() {

    Object.keys(peerConnections).forEach(userId => {

        peerConnections[userId].close();

        removeRemoteVideo(userId);

    });

}



// ==========================================================
// RECONNECT LOCAL TRACKS
// ==========================================================

function reconnectTracks() {

    if (!localStream)
        return;

    Object.values(peerConnections).forEach(pc => {

        localStream.getTracks().forEach(track => {

            const exists = pc.getSenders().some(sender =>

                sender.track &&
                sender.track.kind === track.kind

            );

            if (!exists) {

                pc.addTrack(track, localStream);

            }

        });

    });

}
// ==========================================================
// WAIT FOR ICE GATHERING
// ==========================================================

async function waitForIceGathering(pc) {

    if (pc.iceGatheringState === "complete")
        return;

    await new Promise(resolve => {

        function checkState() {

            if (pc.iceGatheringState === "complete") {

                pc.removeEventListener(
                    "icegatheringstatechange",
                    checkState
                );

                resolve();

            }

        }

        pc.addEventListener(
            "icegatheringstatechange",
            checkState
        );

    });

}



// ==========================================================
// CREATE OFFER
// ==========================================================

async function createOffer(userId) {

    try {

        if (!localStream) {

            console.log("No local stream.");

            return;

        }

        const pc = createPeerConnection(userId);

        if (

            pc.signalingState !== "stable"

        ) {

            console.log(

                "Skipping Offer",

                pc.signalingState

            );

            return;

        }

        const offer = await pc.createOffer({

            offerToReceiveAudio: true,

            offerToReceiveVideo: true

        });

        await pc.setLocalDescription(offer);

        await waitForIceGathering(pc);

        socket.send(JSON.stringify({

            type: "video_offer",

            target_user_id: userId,

            offer: pc.localDescription

        }));

        console.log(

            "Offer Sent ->",

            userId

        );

    }

    catch (err) {

        console.error(err);

    }

}



// ==========================================================
// HANDLE OFFER
// ==========================================================

async function handleOffer(senderId, offer) {

    try {

        const pc = createPeerConnection(senderId);

        if (

            pc.signalingState !== "stable"

        ) {

            await pc.setLocalDescription({

                type: "rollback"

            });

        }

        await pc.setRemoteDescription(

            new RTCSessionDescription(offer)

        );

        if (localStream) {

            localStream.getTracks().forEach(track => {

                const exists =

                    pc.getSenders().some(sender =>

                        sender.track &&
                        sender.track.kind === track.kind

                    );

                if (!exists) {

                    pc.addTrack(track, localStream);

                }

            });

        }

        const answer =

            await pc.createAnswer();

        await pc.setLocalDescription(answer);

        await waitForIceGathering(pc);

        socket.send(JSON.stringify({

            type: "video_answer",

            target_user_id: senderId,

            answer: pc.localDescription

        }));

        console.log(

            "Answer Sent ->",

            senderId

        );

    }

    catch (err) {

        console.error(err);

    }

}



// ==========================================================
// HANDLE ANSWER
// ==========================================================

async function handleAnswer(

    senderId,

    answer

) {

    try {

        const pc = peerConnections[senderId];

        if (!pc)
            return;

        if (

            pc.signalingState !==

            "have-local-offer"

        ) {

            console.log(

                "Ignoring Answer"

            );

            return;

        }

        await pc.setRemoteDescription(

            new RTCSessionDescription(answer)

        );

        console.log(

            "Remote Description Set",

            senderId

        );

    }

    catch (err) {

        console.error(err);

    }

}



// ==========================================================
// HANDLE ICE CANDIDATE
// ==========================================================

async function handleIceCandidate(

    senderId,

    candidate

) {

    try {

        const pc =

            peerConnections[senderId];

        if (!pc)
            return;

        if (!candidate)
            return;

        await pc.addIceCandidate(

            new RTCIceCandidate(candidate)

        );

    }

    catch (err) {

        console.error(err);

    }

}
// ==========================================================
// SPEECH RECOGNITION
// ==========================================================

function startSpeechRecognition() {

    if (recognitionRunning)
        return;

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        console.log("Speech Recognition not supported.");

        return;

    }

    speechRecognition = new SpeechRecognition();

    speechRecognition.continuous = true;

    speechRecognition.interimResults = true;

    speechRecognition.lang = "en-US";

    speechRecognition.onresult = (event) => {

        let transcript = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            if (event.results[i].isFinal) {

                transcript +=
                    event.results[i][0].transcript + " ";

            }

        }

        if (transcript.trim()) {

            meetingTranscript += transcript + "\n";

            console.log("Transcript:", meetingTranscript);

        }

    };

    speechRecognition.onend = () => {

        if (recognitionRunning) {

            speechRecognition.start();

        }

    };

    recognitionRunning = true;
    speechRecognition.start();

}
// ==========================================================
// START VIDEO CALL WITH ONLINE USERS
// ==========================================================

function startVideoCalls(users) {

    console.log("startVideoCalls called");
    console.log("currentUser =", currentUser);
    console.log("users =", users);
    console.log("localStream =", localStream);

    if (!currentUser) {
        console.log("currentUser missing");
        return;
    }

    if (!localStream) {
        console.log("localStream missing");
        return;
    }

    users.forEach(user => {

        console.log("checking", user.id);

        if (user.id === currentUser.id)
            return;

        console.log("creating offer for", user.id);

        createOffer(user.id);

    });
}


// ==========================================================
// REMOVE USERS WHO LEFT
// ==========================================================

function updatePeerConnections(users) {

    const activeIds = users.map(u => u.id);

    Object.keys(peerConnections).forEach(id => {

        id = Number(id);

        if (!activeIds.includes(id)) {

            console.log("Removing User :", id);

            removeRemoteVideo(id);

        }

    });

}



// ==========================================================
// ONLINE USER UPDATE
// ==========================================================

function onOnlineUsers(users) {

    renderOnlineUsers(users);

    updatePeerConnections(users);

    startVideoCalls(users);

}



// ==========================================================
// STOP LOCAL MEDIA
// ==========================================================

function stopLocalMedia() {

    if (localStream) {

        localStream.getTracks().forEach(track => {

            track.stop();

        });

        localStream = null;

    }

    if (screenStream) {

        screenStream.getTracks().forEach(track => {

            track.stop();

        });

        screenStream = null;

    }

}



// ==========================================================
// LEAVE MEETING
// ==========================================================

function leaveMeeting() {

    recognitionRunning = false;

    if (speechRecognition) {

        speechRecognition.stop();

    }

    stopLocalMedia();

    closeAllPeerConnections();

}
// ==========================================================
// GET TRANSCRIPT
// ==========================================================

function getMeetingTranscript() {

    return meetingTranscript.trim();

}


// ==========================================================
// EXIT ROOM
// ==========================================================

document.getElementById("exitBtn").onclick = () => {

    console.log("Meeting Transcript:");
    console.log(getMeetingTranscript());

    leaveMeeting();
    if (socket) {
        socket.close();
}
window.location.href = "/dashboard";

};



// ==========================================================
// CLEANUP ON BROWSER CLOSE
// ==========================================================

window.addEventListener("beforeunload", () => {

    leaveMeeting();

    if (socket) {

        socket.close();

    }

});



// ==========================================================
// CLEANUP ON PAGE HIDE (Mobile Support)
// ==========================================================

window.addEventListener("pagehide", () => {

    leaveMeeting();

});



// ==========================================================
// HANDLE SOCKET CLOSE
// ==========================================================

function cleanupDisconnectedPeers() {

    Object.keys(peerConnections).forEach(id => {

        removeRemoteVideo(id);

    });

}



// ==========================================================
// SOCKET DISCONNECT
// ==========================================================

if (socket) {

    socket.addEventListener("close", () => {

        console.log("Socket Closed");

        cleanupDisconnectedPeers();

    });

}



// ==========================================================
// SOCKET ERROR
// ==========================================================

if (socket) {

    socket.addEventListener("error", err => {

        console.error(err);

    });

}



// ==========================================================
// DEBUG
// ==========================================================

window.debugMeeting = () => {

    console.log({

        localStream,

        screenStream,

        peerConnections,

        currentUser

    });

};
document
.getElementById("generateMom")
.onclick = async ()=>{

    const res = await fetch(

        `${API_BASE}/meeting/${roomId}/generate`,

        {
            method:"POST",
            headers
        }

    );

    const data = await res.json();

    document.getElementById(
        "meetingSummary"
    ).innerHTML =

`
SUMMARY

${data.summary}

-------------------

DECISIONS

${data.decisions.join("\n")}

-------------------

TASKS

${data.action_items.join("\n")}

-------------------

QUESTIONS

${data.questions.join("\n")}
`;

};
async function updateMeetingSummary(){

    const response = await fetch(

        `${API_BASE}/meeting/${roomId}/generate`,

        {

            method:"POST",

            headers

        }

    );

    const data = await response.json();

    renderMeetingSummary(data);

}