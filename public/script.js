const video = document.getElementById("videoPlayer");
const playButton = document.getElementById("searchButton");
const pauseButton = document.getElementById("pauseButton");
const syncButton = document.getElementById("syncButton");
const restartButton = document.getElementById("restartButton");
const skipButton = document.getElementById("skipButton");
// const client = io({
//     port: 3000
// });

const protocol = location.protocol == "http:" ? "ws:" : "wss";
const port = location.port;
const uri = `${protocol}//${location.hostname}:${location.port}`;

class EventEmitter {
    _events = {};

    constructor() {
        this.addEventListener = this.on;
        this.removeEventListener = this.off;
    }

    on(evtn, callback) {
        if (!this._events[evtn]) this._events[evtn] = [];

        this._events[evtn].push({
            once: false,
            callback
        });
    }

    off(evtn, callback) {
        if (!this._events[evtn]) return;

        for (const obj of this._events[evtn]) {
            if (obj.callback == callback) {
                this._events.splice(this._events.indexOf(obj), 1);
            }
        }
    }

    once(evtn, callback) {
        if (!this._events[evtn]) this._events[evtn] = [];

        this._events[evtn].push({
            once: true,
            callback
        });
    }

    emit(evtn, ...args) {
        if (!this._events[evtn]) return;

        for (const evt of this._events[evtn]) {
            evt.callback(...args);

            if (evt.once) {
                this._events.splice(this._events.indexOf(obj), 1);
            }
        }
    }
}

class Client extends EventEmitter {
    constructor(uri) {
        super();
        this.uri = uri;
        this.started = false;
    }

    start() {
        if (this.started) return;
        this.started = true;
        this.connect();
    }

    stop() {
        if (!this.started) return;
        this.started = false;
    }

    connect() {
        this.ws = new WebSocket(this.uri);

        this.ws.addEventListener("open", () => {
            console.log("websocket connected");

            super.emit("reconnect");
        });

        this.ws.addEventListener("close", () => {
            console.log("websocket disconnected");
        });

        this.ws.addEventListener("message", evt => {
            try {
                const str = evt.data.toString();
                const j = JSON.parse(str);

                console.log(j);

                super.emit(j.evtn, ...j.args);
            } catch (err) {
                super.emit("wserror", err);
            }
        });
    }

    isConnected() {
        return this.ws.readyState == WebSocket.OPEN;
    }

    isConnecting() {
        return this.ws.readyState == WebSocket.CONNECTING;
    }

    emit(evtn, ...args) {
        if (!this.isConnected()) return;
        const evt = { evtn, args };
        this.ws.send(JSON.stringify(evt));
    }
}

const client = new Client(uri);
client.start();

let cursorData = {};
function submitUsername() {
    const name = document.getElementById("usernameInput").value;
    if (name.trim() !== "") {
        document.getElementById("usernameOverlay").style.display = "none";
        if (!localStorage.pfp || localStorage.pfp == undefined) {
            generateProfilePicture(name);
        }
        setTimeout(() => {
            client.emit("username", {
                selfUsername: name,
                pfp: localStorage.pfp
            });
        }, 2256);

        selfUsername = name;
        localStorage.selfUsername = name;
    } else {
        alert("Username cannot be empty!");
    }
}
document
    .getElementById("submitUsernameButton")
    .addEventListener("click", submitUsername);
document.getElementById("usernameInput").addEventListener("keydown", evt => {
    if (evt.key === "Enter") {
        submitUsername();
    }
});
let selfUsername = "";
function setCurrentSong(name, link, author, url) {
    const playing = document.getElementById("currentlyPlaying");
    const li = document.createElement("li");
    li.classList.add("search-result");
    const div = document.createElement("div");
    div.classList.add("thumbnail");
    div.style.backgroundImage = "url(" + url + ")";
    li.appendChild(div);
    li.innerHTML +=
        "\n                  <strong>" +
        name +
        "</strong><br>\n                  Link: " +
        link +
        "<br>\n                  Author: " +
        author +
        '<br>\n                  <a href="' +
        url +
        '" target="_blank">Thumbnail</a>\n              ';
    playing.appendChild(li);
}
function addToQueue(name, link, author, thumbnail) {
    const results = document.getElementById("searchResults");
    const li = document.createElement("li");
    li.classList.add("search-result");
    const div = document.createElement("div");
    div.classList.add("thumbnail");
    div.style.backgroundImage = "url(" + thumbnail + ")";
    li.appendChild(div);
    li.innerHTML +=
        "\n        <strong>" +
        name +
        "</strong><br>\n                  Link: " +
        link +
        "<br>\n                  Author: " +
        author +
        '<br>\n                  <a href="' +
        thumbnail +
        '" target="_blank">Thumbnail</a>\n              ';
    results.appendChild(li);
}
let notificationCount = 0x0;
function addUserToList(username, pfpUrl, tags) {
    if (tags.includes("Owner")) {
        document.getElementById("cursors").insertAdjacentHTML(
            "beforeend",
            `<div id="${
                username + "0001"
            }" style="position: fixed; z-index: 9999999; width: 21px; height: 30px;">
              <img style="width: 100%; height: 100%;" src="https://mpp.hri7566.info/rainbow_cursor.svg"></img>
              <span class="rainbow" style="pointer-events: none; user-select: none;">${username}</span>
          </div>`
        );
    } else if (tags.includes("Dev")) {
        document.getElementById("cursors").insertAdjacentHTML(
            "beforeend",
            `<div id="${
                username + "0001"
            }" style="position: fixed; z-index: 9999999; width: 21px; height: 30px;">
              <img style="width: 100%; height: 100%;" src="https://mpp.hri7566.info/rainbow_cursor.svg"></img>
              <span style="color: #00FF00; pointer-events: none; user-select: none;">${username}</span>
          </div>`
        );
    } else if (tags.includes("Admin")) {
        document.getElementById("cursors").insertAdjacentHTML(
            "beforeend",
            `<div id="${
                username + "0001"
            }" style="position: fixed; z-index: 9999999; width: 21px; height: 30px;">
              <img style="width: 100%; height: 100%;" src="https://mpp.hri7566.info/rainbow_cursor.svg"></img>
              <span style="color: #FF0000; pointer-events: none; user-select: none;">${username}</span>
          </div>`
        );
    } else {
        document.getElementById("cursors").insertAdjacentHTML(
            "beforeend",
            `<div id="${
                username + "0001"
            }" style="position: fixed; z-index: 9999999; width: 21px; height: 30px;">
              <img style="width: 100%; height: 100%;" src="https://mpp.hri7566.info/rainbow_cursor.svg"></img>
              <span style="pointer-events: none; user-select: none;">${username}</span>
          </div>`
        );
    }

    const userlist = document.getElementById("userList");
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = pfpUrl;
    img.alt = "Profile Picture";
    img.style.width = "30px";
    img.style.height = "30px";
    img.style.borderRadius = "50%";
    li.appendChild(img);
    const span = document.createElement("span");
    span.textContent = username;
    tags.forEach(tag => {
        if (tag === "Admin") {
            span.style.color = "red";
        }
        if (tag === "Dev") {
            const greenAnimationStyle = document.createElement("style");
            greenAnimationStyle.innerHTML = `
        @keyframes greenDev {
          0% { color: #00FF00; } /* Green */
          100% { color: #00FF00; } /* Green */
        }
      `;
            document.head.appendChild(greenAnimationStyle);
            span.classList.add("greenDev");
        }
        if (tag == "Owner") {
            const rainbowAnimationStyle = document.createElement("style");
            rainbowAnimationStyle.innerHTML = `
        @keyframes rainbow {
          0% { color: red; }
          16.67% { color: orange; }
          33.33% { color: yellow; }
          50% { color: green; }
          66.67% { color: blue; }
          83.33% { color: indigo; }
          100% { color: violet; }
        }
      `;

            document.head.appendChild(rainbowAnimationStyle);
            span.classList.add("rainbow");
        }
    });
    li.appendChild(span);
    userlist.appendChild(li);
}
function removeUserFromList(name) {
    const userlist = document.getElementById("userList");
    const li = userlist.getElementsByTagName("li");
    for (let i = 0x0; i < li.length; i++) {
        const val = li[i];
        if (val.textContent === name) {
            userlist.removeChild(val);
            break;
        }
    }
}
function userIsTalking(name) {
    const userlist = document.getElementById("userList");
    const li = userlist.getElementsByTagName("li");
    for (let i = 0x0; i < li.length; i++) {
        const val = li[i];
        if (val.textContent === name) {
            val.classList.remove("not-talking");
            val.classList.add("talking");
            break;
        }
    }
}
function userIsNotTalking(name) {
    const userlist = document.getElementById("userList");
    const li = userlist.getElementsByTagName("li");
    for (let i = 0; i < li.length; i++) {
        const val = li[i];
        if (val.textContent === name) {
            val.classList.remove("talking");
            val.classList.add("not-talking");
            break;
        }
    }
}
function showNotification(title, description, color) {
    const div = document.createElement("div");
    div.classList.add("notification");
    div.style.backgroundColor = color;
    div.style.bottom = 20 + notificationCount + "px";
    notificationCount += 80;
    div.innerHTML =
        '\n        <div class="notification-content">\n          <h3 class="notification-title">' +
        title +
        '</h3>\n          <p class="notification-description">' +
        description +
        "</p>\n        </div>\n      ";
    const notifList = document.getElementById("notificationList");
    notifList.appendChild(div);
    setTimeout(() => {
        let opacity = 1;
        const updateInterval = setInterval(() => {
            div.style.opacity = opacity;
            opacity -= 0.01;
            if (opacity <= 0) {
                clearInterval(updateInterval);
                div.remove();
                notificationCount -= 80;
                const notifs = document.querySelectorAll(".notification");
                notifs.forEach(n => {
                    n.style.bottom = parseInt(n.style.bottom) - 80 + "px";
                });
            }
        }, 40);
    }, 6000);
    notifList.style.display = "block";
    div.style.display = "block";
}

var pointerX = -1;
var pointerY = -1;

client.on("test", text => {
    console.log(text);
});

client.on("queueAdd", ({ title, url, author, thumbnail }) => {
    console.log(title, url, author, thumbnail);
    addToQueue(title, url, author, thumbnail);
});

client.on("currentSong", ({ title, url, author, thumbnail }) => {
    const currentlyPlaying = document.getElementById("currentlyPlaying");
    const searchResult =
        currentlyPlaying.getElementsByClassName("search-result");
    if (searchResult.length == 0x0) {
        setCurrentSong(title, url, author, thumbnail);
    } else {
        searchResult[0x0].remove();
        setCurrentSong(title, url, author, thumbnail);
    }
});
client.on("notify", (type, title, description, color, tags) => {
    if (type.toLowerCase().includes("join")) {
        let arg = title.split(" ")[0];
        addUserToList(arg, color, tags);
        document.onmousemove = function (evt) {};
        // setInterval(pointerCheck, 1000 / 60);

        // function pointerCheck() {
        //     cursorData[localStorage.selfUsername] = {
        //         x: pointerX,
        //         y: pointerY
        //     };
        //     client.emit("Cursor Move", {
        //         username: localStorage.selfUsername,
        //         dt: { x: pointerX, y: pointerY }
        //     });
        // }
    }
    if (type.toLowerCase().includes("leave")) {
        let arg = title.split(" ")[0];
        removeUserFromList(arg);
    }
    showNotification(type, title, description);
});

document.addEventListener("mousemove", evt => {
    pointerX = evt.clientX;
    pointerY = evt.clientY;

    client.emit("Cursor Move", {
        dt: { x: pointerX, y: pointerY }
    });
});

client.on("connect", () => {
    console.log(
        "%cConnected to the server!",
        "font-size: 16px; color: #43b581;"
    );
});
client.on("pause", () => {
    video.pause();
});
client.on("playMovie", () => {
    client.emit("requestVideoData");
});
client.on("videoData", data => {
    if (data && data.byteLength > 0x0) {
        const blob = new Blob([data], {
            type: "video/mp4"
        });
        const url = URL.createObjectURL(blob);
        video.src = url;
        video.play();
    }
});
client.on("queueRemove", ({ title }) => {
    const searchResults = document.getElementById("searchResults");
    const results = searchResults.getElementsByClassName("search-result");
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const resultTitle = result.querySelector("strong").textContent;
        if (resultTitle === title) {
            result.remove();
            break;
        }
    }
});

function isPageVisible() {
    return document.hidden;
}

function playAudioIfVisible(audioSrc) {
    if (isPageVisible()) {
        let audio = new Audio(audioSrc);
        audio.play();
    }
}

client.on("play", () => {
    video.play();
});
client.on("sync", time => {
    video.currentTime = time;
});
client.on("currentTime", time => {
    if (!video.paused) {
        video.currentTime = time;
    }
});
client.on("chat", user => {
    // playAudioIfVisible(
    //   "https://www.myinstants.com/media/sounds/hell_AJWSn3e.mp3",
    // );
    if (user.username.includes("Host")) {
        addChatMessage(user.username, user.message, true);
    } else if (
        user.username.includes("Owner") ||
        user.username.includes("Dev") ||
        user.username.includes("Admin") ||
        user.username.includes("Bot") ||
        user.username.includes("Furry") ||
        user.username.includes("Cutie")
    ) {
        addChatMessage(user.username, user.message, true);
    } else {
        addChatMessage(user.username, user.message, false);
    }
});
syncButton.addEventListener("click", () => {
    client.emit("sync", video.currentTime);
});
skipButton.addEventListener("click", () => {
    client.emit("skip");
});
playButton.addEventListener("click", () => {
    client.emit("play");
});
pauseButton.addEventListener("click", () => {
    video.pause();
    client.emit("pause");
});
restartButton.addEventListener("click", () => {
    client.emit("restart");
});
const searchInput = document.querySelector(".search-bar input[type='text']");
const searchButton = document.getElementById("searchButton");
searchButton.addEventListener("click", () => {
    const input = searchInput.value.trim();
    client.emit("url", input);
});
setInterval(() => {
    client.emit("syncRealtime", video.currentTime);
}, 0x1);
const searchResults = document.getElementById("searchResults");
searchResults.addEventListener("click", evt => {
    if (evt.target && evt.target.matches(".search-result")) {
        const url = evt.target.dataset.url;
        if (url) {
            client.emit("url", url);
        }
    }
});
function generateProfilePicture(text) {
    return new Promise((_0x419fde, _0x212655) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 200;
        canvas.height = 200;
        ctx.fillStyle = "#4f545c";
        ctx.fillRect(0, 0, 200, 200);
        ctx.font = "bold 80px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text.charAt(0x0).toUpperCase(), 100, 100);
        const dataUrl =
            "data:image/png;base64," +
            canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
        localStorage.pfp = dataUrl;
    });
}
let roomOverlay = document.getElementById("roomOverlay");
roomOverlay.style.display = "none";
let joinOrCreateRoomButton = document.getElementById("joinOrCreateRoomButton");
joinOrCreateRoomButton.addEventListener("click", () => {
    roomOverlay.style.display = "block";
});
client.on(
    "leave",
    ({ username, pfp, channelName, channelID, otherUsernames }) => {
        otherUsernames.forEach(name => {
            if (name !== localStorage.selfUsername) {
                removeUserFromList(name);
                document.getElementById(`${name}0001`).remove();
            }
        });
        showNotification("Leave", username + " left the channel!", "#43b581");
        document.getElementById(`${username}0001`).remove();
    }
);

client.on("Update Cursor", ({ username, cursorData }) => {
    try {
        if (username == localStorage.selfUsername)
            document
                .getElementById(`${localStorage.selfUsername}0001`)
                .remove();
        let cursor = document.getElementById(username + "0001");
        if (cursor.style == null) return;
        cursor.style.left = cursorData.x + "px";
        cursor.style.top = cursorData.y + "px";
    } catch (e) {}
});

client.on("join", ({ username, pfp, channleName, channelID, tags }) => {
    showNotification("Join", username + " joined the channel!", "#43b581");
    addUserToList(username, pfp, tags);
});
let roomSubmitButton = document.getElementById("roomSubmitButton");
roomSubmitButton.addEventListener("click", () => {
    let _0x56a0d4 = document.getElementById("roomOverlayInput");
    client.emit("joinOrCreateRoom", _0x56a0d4.value);
    roomOverlay.style.display = "none";
});
video.addEventListener("ended", () => {
    client.emit("videoEnd");
});
let mute = true;
let a;
const talkingStatus = {};
client.on("vc", user => {
    const name = user.username;
    userIsTalking(name);
    talkingStatus[name] = true;
    let audio = new Audio(user.vcData);
    audio.addEventListener("ended", () => {
        talkingStatus[name] = false;
        userIsNotTalking(name);
    });
    audio.addEventListener("loadeddata", () => {
        if (localStorage.selfUsername === name) {
            audio.volume = 0x0;
        }
        audio.play();
    });
});
client.on("disconnect", () => {
    console.log(
        "%cDisconnected from the server!",
        "font-size: 16px; color: #f04747;"
    );
});
client.on("reconnect", () => {
    console.log(
        "%cReconnected to the server!",
        "font-size: 16px; color: #43b581;"
    );
    client.emit("username", {
        selfUsername: localStorage.selfUsername,
        pfp: localStorage.pfp
    });
});
client.on("reconnect_attempt", () => {
    console.log(
        "%cAttempting to reconnect...",
        "font-size: 16px; color: #faa61a;"
    );
});
client.on("updateSync", () => {
    client.emit("updateSync", video.currentTime);
});
setInterval(() => {
    client.emit("requestSync");
}, 0x7530);
window.addEventListener("load", () => {});
function addChatMessage(name, message, admin = false) {
    const messageList = document.getElementById("chatbox-messages");
    const div = document.createElement("div");
    div.classList.add("chat-message");
    if (!admin) {
        div.textContent = name + ": " + message;
    } else {
        let n = name;
        if (name.includes("Host")) {
            n = n.replace(
                /\bHost\b/g,
                '<span style="color: #FFA500;">Host</span>'
            );
        }
        if (name.includes("Admin")) {
            n = n.replace(
                /\bAdmin\b/g,
                '<span style="color: #FF0000;">Admin</span>'
            );
        }
        if (name.includes("Bot")) {
            n = n.replace(
                /\bBot\b/g,
                '<span style="color: #5865F2;">Bot</span>'
            );
        }
        if (name.includes("Cutie")) {
            n = n.replace(
                /\bCutie\b/g,
                '<span style="color: #ffccff;">Cutie</span>'
            );
        }
        if (name.includes("Furry")) {
            let _0x32f04e = document.createElement("style");
            _0x32f04e.innerHTML =
                "@keyframes rainbow {\n          0% { color: red; }\n          16.67% { color: orange; }\n          33.33% { color: yellow; }\n          50% { color: green; }\n          66.67% { color: blue; }\n          83.33% { color: indigo; }\n          100% { color: violet; }\n        }";
            document.head.appendChild(_0x32f04e);
            n = n.replace(
                /\bFurry\b/g,
                '<span class="rainbow">Furry 🐾</span>'
            );
        }
        if (name.includes("Owner")) {
            let _0x32f04e = document.createElement("style");
            _0x32f04e.innerHTML =
                "@keyframes rainbow {\n          0% { color: red; }\n          16.67% { color: orange; }\n          33.33% { color: yellow; }\n          50% { color: green; }\n          66.67% { color: blue; }\n          83.33% { color: indigo; }\n          100% { color: violet; }\n        }";
            document.head.appendChild(_0x32f04e);
            n = n.replace(/\bOwner\b/g, '<span class="rainbow">Owner</span>');

            message = message.replace(
                message,
                `<span class="rainbow">${message}</span>`
            );
        }
        if (name.includes("Dev")) {
            n = n.replace(
                /\bDev\b/g,
                '<span style="color: #00FF00;">Dev</span>'
            );
        }
        div.innerHTML = n + ": " + message;
    }
    messageList.appendChild(div);
    messageList.scrollTop = messageList.scrollHeight;
}
const choosePFPButton = document.getElementById("choosePFPButton");
const fileInput = document.getElementById("fileInput");
choosePFPButton.addEventListener("click", () => {
    fileInput.click();
});
fileInput.addEventListener("change", something => {
    const file = something.target.files[0];
    if (file) {
        const fileReader = new FileReader();
        fileReader.onload = function (evt) {
            const pfpData = evt.target.result;
            localStorage.setItem("pfp", pfpData);
        };
        fileReader.readAsDataURL(file);
    }
});

const sendButton = document.getElementById("chatbox-send");

sendButton.addEventListener("click", () => {
    const chatbox = document.getElementById("chatbox");
    const input = document.getElementById("chatbox-input");
    const text = input.value.trim();
    if (text !== "") {
        client.emit("userChatMessage", text);
        input.value = "";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const chatbox = document.getElementById("chatbox");
    const input = document.getElementById("chatbox-input");
    function setDisplayStyle() {
        chatbox.style.display =
            chatbox.style.display === "none" ? "block" : "none";
    }
    if (localStorage.selfUsername && localStorage.pfp) {
        const overlay = document.getElementById("usernameOverlay");
        if (overlay) {
            overlay.style.display = "none";
            client.emit("username", {
                selfUsername: localStorage.selfUsername,
                pfp: localStorage.pfp
            });
        }
    }
    let media;
    let mediaUser;
    try {
        mediaUser = navigator.mediaDevices.getUserMedia({
            audio: true
        });
    } catch (err) {}

    async function o() {
        media = await mediaUser;
    }

    try {
        o();
    } catch (err) {}

    document.addEventListener("keydown", function (evt) {
        try {
            if (evt.key == "\\") {
                if (mute == true) {
                    showNotification(
                        "Voice Chat",
                        "Voice chat is now enabled."
                    );
                    a = setInterval(() => {
                        let recorder = new MediaRecorder(media);
                        recorder.start();
                        recorder.ondataavailable = function (evt) {
                            var reader = new FileReader();
                            reader.readAsDataURL(evt.data);
                            reader.onloadend = function () {
                                var result = reader.result;
                                client.emit("custom", {
                                    data: {
                                        m: "vc",
                                        vcData: result.toString()
                                    },
                                    target: {
                                        mode: "subscribed",
                                        global: false
                                    }
                                });
                            };
                        };
                        setTimeout(() => {
                            recorder.stop();
                        }, 300);
                    }, 250);
                    mute = false;
                } else if (mute == false) {
                    showNotification(
                        "Voice Chat",
                        "Voice chat is now disabled.",
                        "#f04747"
                    );
                    clearInterval(a);
                    mute = true;
                }
            }
        } catch (err) {}
        if (evt.code == "Enter") {
            const text = input.value.trim();
            if (text !== "") {
                client.emit("userChatMessage", text);
                input.value = "";
            }
        }
        if (evt.key === "/") {
            if (chatbox.style.display !== "block") {
                evt.preventDefault();
            }
            setDisplayStyle();
        }
    });
});
console.log(
    "%cWELCOME TO THE SNOWLY DEV CONSOLE",
    "font-size: 35px; color: #ffffff; font-weight: bold; background-color: #36393f; padding: 10px;"
);
console.log(
    "%cDo not paste anything anyone sends you, or it may end up getting your cookies compromised",
    "font-size: 16px; color: #ff0000;"
);
