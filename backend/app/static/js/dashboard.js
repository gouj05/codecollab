// -----------------------------
// Save token from URL (after Google login)
// -----------------------------
const params = new URLSearchParams(window.location.search);

const urlToken = params.get("token");

if (urlToken) {

    localStorage.setItem("token", urlToken);

    // Remove token from URL
    window.history.replaceState({}, "", "/dashboard");
}


// -----------------------------
// Get token
// -----------------------------
const token = localStorage.getItem("token");

if (!token) {

    window.location.replace("/");

    throw new Error("No token found");

}


// -----------------------------
// Headers
// -----------------------------
const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
};


// -----------------------------
// Load User
// -----------------------------
async function loadUser() {

    try {

        const response = await fetch(`${API_BASE}/auth/me`, {
            headers
        });

        if (response.status === 401) {

            logout();

            return;
        }

        const user = await response.json();

        document.getElementById("userName").innerText = user.name;

        document.getElementById("welcome").innerText =
            `Welcome, ${user.name}!`;

        document.getElementById("profilePic").src = user.picture;

    }
    catch (err) {

        console.error(err);

    }

}


// -----------------------------
// Load Rooms
// -----------------------------
async function loadRooms() {

    const response = await fetch(`${API_BASE}/rooms/my`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const rooms = await response.json();
    console.log("Rooms API response:", rooms);
    const container = document.getElementById("roomsContainer");
    console.log(container);
    container.innerHTML = "";

    rooms.forEach(room => {

        container.innerHTML += `
<div class="room-card">

    <div class="room-info">

        <div class="room-title">
            ${room.title}
        </div>

        <div class="room-code">
            ${room.room_code}
        </div>

    </div>

    <div class="room-actions">

        <button
            class="join-btn"
            onclick="joinRoom('${room.room_code}')">

            Join

        </button>

        <button
            class="delete-btn"
            onclick="deleteRoom(${room.id})">

            🗑

        </button>

    </div>

</div>
`;
    });

}
async function deleteRoom(roomId) {

    if (!confirm("Delete this room?"))
        return;

    const response = await fetch(
        `${API_BASE}/rooms/${roomId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    const text = await response.text();

    console.log("DELETE RESPONSE:");
    console.log(text);

    if (!response.ok) {

        alert(text);

        return;

    }

    loadRooms();

}
// -----------------------------
// Create Room
// -----------------------------
async function createRoom() {

    const title = document
        .getElementById("roomTitle")
        .value
        .trim();

    if (!title) {

        alert("Enter room title");

        return;

    }

    try {

        const response = await fetch(

            `${API_BASE}/rooms/create`,

            {

                method: "POST",

                headers: {

                    ...headers,

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    title: title

                })

            }

        );

        if (response.status === 401) {

            logout();

            return;

        }

        const room = await response.json();

        if (!response.ok) {

            alert(room.detail || "Unable to create room");

            return;

        }

        alert(

            `Room Created!

Title : ${room.title}

Code : ${room.room_code}`

        );

        document
            .getElementById("roomTitle")
            .value = "";

        await loadRooms();

    }

    catch (err) {

        console.error(err);

        alert("Unable to create room.");

    }

}
// -----------------------------
// Join Room
// -----------------------------
function joinRoom(roomCode) {

    // Called from Join button
    if (typeof roomCode === "string") {

        window.location.href =
            `/room?room=${roomCode}`;

        return;
    }

    // Called from Join by Code button
    const code = document.getElementById("roomCode").value.trim();

    if (!code) {

        alert("Enter room code");

        return;

    }

    window.location.href =
        `/room?room=${code}`;
}
// -----------------------------
// Logout
// -----------------------------
function logout() {

    localStorage.removeItem("token");

    window.location.href = "/";

}


// -----------------------------
// Events
// -----------------------------
document
    .getElementById("logoutBtn")
    .onclick = logout;

document
    .getElementById("createRoomBtn")
    .onclick = createRoom;

document
    .getElementById("joinRoomBtn")
    .onclick = joinRoom;


// -----------------------------
// Initial Load
// -----------------------------
loadUser();
loadRooms();