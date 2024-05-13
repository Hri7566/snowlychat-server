import fs from "fs";
import path from "path/posix";
import Fastify from "fastify";
import crypto from "crypto";
import fastifyStatic from "@fastify/static";
// import { Server } from "socket.io";
import { env } from "./env";
import obfuscator from "javascript-obfuscator";
import axios from "axios";
import ytdl from "ytdl-core";
import fastifySocketIO from "fastify-socket.io";
import { WebSocketServer } from "ws";
import EventEmitter from "events";

const pkg = import("./package.json");
const app = Fastify({
    port: env.PORT
});

const wss = new WebSocketServer({
    server: app.server
});

class Socket extends EventEmitter {
    constructor(ws, req) {
        super();
        this.ws = ws;
        this.req = req;
        this.handshake = req;
        this.handshake.address = req.socket.remoteAddress;

        this.ip = this.handshake.address;

        ws.on("message", data => {
            try {
                const text = data.toString();
                const j = JSON.parse(text);
                super.emit(j.evtn, ...j.args);
            } catch (err) {
                console.error(err);
            }
        });

        ws.on("close", () => {
            super.emit("disconnect");
        });
    }

    destroyed = false;

    destroy() {
        try {
            if (this.ws) this.ws.close();
            this.destroyed = true;
        } catch (err) {
            console.error(err);
        }
    }

    emit(evtn, ...args) {
        try {
            this.ws.send(
                JSON.stringify({
                    evtn,
                    args
                })
            );
        } catch (err) {
            console.error(err);
        }
    }
}

class IO extends EventEmitter {
    constructor() {
        super();

        this.oldEmit = super.emit;
    }

    emit(evtn, ...args) {
        connectedSockets.forEach(sock => {
            sock.emit(evtn, ...args);
        });
    }
}

const io = new IO();

wss.on("connection", (ws, req) => {
    ws.socket = new Socket(ws, req);
    io.oldEmit("connection", ws.socket);
});

function hashWithSalt(password, salt) {
    const hash = crypto.createHash("sha256");
    hash.update(password + salt);
    return hash.digest("hex");
}

app.register(fastifyStatic, {
    root: path.resolve("./public")
});

// await app.register(fastifySocketIO, {
//     maxHttpBufferSize: 150000e7,
//     pingTimeout: 30000
// });

// app.get("/", (req, res) => {
//     res.sendFile(path.resolve("./public/video.html"));
// });

// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static(path.join(__dirname, "public/dl")));

let currentVersion = pkg.version;

// fetch("https://raw.githubusercontent.com/Snoofz/Snowly/main/version")
//     .then(res => res.text())
//     .then(text => {
//         // console.log("Current Version", text.trim());
//         currentVersion = text.trim();
//     });

// setInterval(() => {
//     fetch("https://raw.githubusercontent.com/Snoofz/Snowly/main/version")
//         .then(res => res.text())
//         .then(text => {
//             // console.log("Current Version", text.trim());
//             currentVersion = text.trim();
//         });
// }, 5000);

function getLinuxDistribution(userAgent) {
    if (userAgent.includes("rpm")) {
        return "rpm";
    } else if (userAgent.includes("deb")) {
        return "deb";
    } else {
        return null;
    }
}

app.get("/biolink/cherry", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "cherry.html"));
});

app.get("/biolink/cherry.css", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "cherry.css"));
});

app.get("/biolink/reset.css", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "reset.css"));
});

app.get("/biolink/js/cherry.js", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "/js/cherry.js"));
});

app.get("/biolink/snoofz", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "snoofz.html"));
});

app.get("/biolink/snoofz.css", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "snoofz.css"));
});

app.get("/biolink/js/snoofz.js", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "/js/snoofz.js"));
});

app.get("/biolink", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "home.html"));
});

app.get("/home.css", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "home.css"));
});

app.get("/reset.css", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "reset.css"));
});

app.get("/js/home.js", (req, res) => {
    res.sendFile(path.join(__dirname, "bios", "/js/home.js"));
});

app.get("/Snowly-Linux", (req, res) => {
    const userAgent = req.headers["user-agent"];
    const distribution = getLinuxDistribution(userAgent);
    if (distribution === "deb" || userAgent.includes("Linux")) {
        res.redirect(
            "https://github.com/Snoofz/Snowly/releases/download/v1.0.1/snowly_1.0.1_amd64.deb"
        );
    } else {
        res.redirect(
            "https://github.com/Snoofz/Snowly/releases/download/v1.0.1/Snowly-1.0.1-1.x86_64.rpm"
        );
    }
});

app.get("/Snowly-Windows", (req, res) => {
    res.redirect(
        "https://github.com/Snoofz/Snowly/releases/download/v1.0.1/Snowly-1.0.1.Setup.exe"
    );
});

app.get("/Snowly-Mac", (req, res) => {
    res.redirect(
        "https://github.com/Snoofz/Snowly/releases/download/v1.0.1/Snowly-darwin-x64-1.0.1.zip"
    );
});

app.get("/download", (req, res) => {
    res.sendFile(path.join(__dirname, "public/download.html"));
});

const { isArray } = require("util");

function hashString(inputString) {
    console.log(inputString);
    if (typeof inputString !== "string") {
        throw new TypeError("Input must be a string");
    }

    const hash = crypto.createHash("sha256");
    hash.update(inputString);
    const hashedString = hash.digest("hex");
    return hashedString;
}

// app.get("/script.js", (req, res) => {
//     const scriptPath = path.join(__dirname, "public/script.js");
//     fs.readFile(scriptPath, "utf8", (err, data) => {
//         if (err) {
//             console.error(err);
//             res.status(500).send("Internal Server Error");
//             return;
//         }

//         const seed = Math.floor(Math.random() * 100000);
//         console.log("Using obfuscation seed", seed);

//         const obfuscationResult = obfuscator.obfuscate(data, {
//             seed: seed
//         });
//         const obfuscatedScript = obfuscationResult.getObfuscatedCode();

//         res.header["content-type"] = "text/javascript";
//         res.send(obfuscatedScript);
//     });
// });

function getFilenameFromUrl(url) {
    return path.basename(url);
}

let isPlaying = false;
let queue = [];
let currentlyPlaying = [];

function downloadYouTubeVideo(socket, videoUrl, directoryPath) {
    const xss = require("xss");
    const url = xss(videoUrl);

    if (
        !videoUrl.includes("www.youtube.com") &&
        !videoUrl.includes("youtu.be")
    ) {
        socket.emit(
            "notify",
            "Heads up!",
            `This website only allows youtube videos... Sorry!`,
            "#f04747"
        );
        return;
    }

    ytdl.getInfo(url)
        .then(info => {
            const videoWithNormalDimensions = info.formats.find(format => {
                if (!format.height || !format.width) return false;

                const widthToHeightRatio = format.width / format.height;
                const heightToWidthRatio = format.height / format.width;

                if (widthToHeightRatio > 5) return false;

                if (heightToWidthRatio > 5) return false;

                return true;
            });

            if (!videoWithNormalDimensions) {
                socket.emit(
                    "notify",
                    "Hold up!",
                    `You attempted to play a video with abnormal video dimensions... The server has declined the video!`,
                    "#f04747"
                );
                console.error(
                    `${socket.username} Attempted to play a video with abnormal video dimensions... No suitable format with normal dimensions found!`
                );
                return;
            }

            const format = ytdl.chooseFormat(info.formats, {
                filter: "audioandvideo"
            });
            if (!format) {
                console.error("No suitable format found");
                return;
            }

            const videoTitle = info.videoDetails.title;
            const videoAuthor = info.videoDetails.author.name;
            const videoThumbnail = info.videoDetails.thumbnails[0].url;
            const videoUrl = info.videoDetails.video_url;

            const filePath = path.join(
                directoryPath,
                `${videoTitle}.${format.container}`
            );

            ytdl.downloadFromInfo(info, { format: format })
                .pipe(fs.createWriteStream(filePath))
                .on("finish", () => {
                    console.log(`Video downloaded successfully to ${filePath}`);
                    if (!isPlaying) {
                        videoData = fs.readFileSync(filePath);
                        connectedSockets.forEach(sock => {
                            if (sock.channelID == socket.channelID) {
                                sock.emit(
                                    "notify",
                                    "Heads up!",
                                    `${socket.username} is now playing ${videoTitle}`,
                                    "#43b581"
                                );
                                currentlyPlaying = [
                                    {
                                        title: videoTitle,
                                        url: videoUrl,
                                        author: videoAuthor,
                                        thumbnail: videoThumbnail,
                                        videoData: fs.readFileSync(filePath)
                                    }
                                ];
                                sock.emit("currentSong", {
                                    title: videoTitle,
                                    url: videoUrl,
                                    author: videoAuthor,
                                    thumbnail: videoThumbnail
                                });
                                sock.emit("playMovie");
                                isPlaying = true;
                            }
                        });
                    } else {
                        connectedSockets.forEach(sock => {
                            if (sock.channelID == socket.channelID) {
                                sock.emit("queueAdd", {
                                    title: videoTitle,
                                    url: videoUrl,
                                    author: videoAuthor,
                                    thumbnail: videoThumbnail
                                });

                                sock.emit(
                                    "notify",
                                    "Heads up!",
                                    `${socket.username} added ${videoTitle} to the queue!`,
                                    "#43b581"
                                );
                            }
                        });

                        channels.forEach(channel => {
                            channel.queue.push({
                                title: videoTitle,
                                url: videoUrl,
                                author: videoAuthor,
                                thumbnail: videoThumbnail,
                                videoDataComplete: fs.readFileSync(filePath)
                            });
                        });
                        channels.forEach(channel => {
                            channel.currentlyPlaying = [
                                {
                                    title: videoTitle,
                                    url: videoUrl,
                                    author: videoAuthor,
                                    thumbnail: videoThumbnail,
                                    videoData: fs.readFileSync(filePath)
                                }
                            ];
                        });
                    }
                })
                .on("error", error => {
                    console.error("Error downloading video:", error);
                });
        })
        .catch(error => {
            console.error("Error fetching video info:", error);
        });
}

let connectedSockets = [];
let channels = [
    {
        channelName: "Lobby",
        channelID: "lobby",
        ownerPFP: "",
        ownerName: "Server"
    }
];

async function generateProfilePicture(username) {
    // Set canvas dimensions
    const canvasWidth = 200;
    const canvasHeight = 200;

    // Create canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Load a font (You may need to specify the path to your font file)
    registerFont("path_to_your_font.ttf", { family: "Arial" });

    // Set background color
    ctx.fillStyle = "#4f545c"; // You can customize the background color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw text
    ctx.font = "bold 80px Arial"; // Customize font size and style as needed
    ctx.fillStyle = "#ffffff"; // Customize text color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        username.charAt(0).toUpperCase(),
        canvasWidth / 2,
        canvasHeight / 2
    );

    // Convert canvas to base64
    const base64Data = canvas
        .toDataURL()
        .replace(/^data:image\/\w+;base64,/, "");

    return base64Data;
}

async function downloadFile(url, destination) {
    const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream"
    });

    const filename = getFilenameFromUrl(url);
    const writer = fs.createWriteStream(path.join(destination, filename));

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", () => resolve(filename));
        writer.on("error", reject);
    });
}

// http.listen(port, () => {
//     console.log(`Server running at http: ${port}`);
// });

let currentTime = 0;
let isPaused = false;
let videoData = Buffer.from("");
let isFirstSocket = true;
let host = "";
let hostIP = "";

io.on("connection", socket => {
    socket.on("syncRealtime", syncCurrentTime => {
        if (syncCurrentTime == undefined) return;
        currentTime = syncCurrentTime;
    });

    socket.on("joinOrCreateRoom", roomName => {
        const existingChannel = channels.find(
            ch => ch.channelName === roomName
        );
        let usernames = [];
        connectedSockets.forEach(c => {
            usernames.push(c.username);
        });
        // Emit "leave" event to all users in the current channel except the switching socket
        connectedSockets.forEach(sock => {
            if (sock.channelID === socket.channelID && sock !== socket) {
                sock.emit("leave", {
                    username: socket.username,
                    pfp: socket.pfp,
                    channelName: socket.channelName,
                    channelID: socket.channelID,
                    otherUsernames: usernames
                });
            }
        });

        // Emit "leave" event to the switching socket with other usernames in the channel

        socket.emit("leave", {
            username: socket.username,
            pfp: socket.pfp,
            channelName: socket.channelName,
            channelID: socket.channelID,
            otherUsernames: usernames
        });

        socket.channelName = roomName;
        socket.channelID = existingChannel
            ? existingChannel.channelID
            : hashString(roomName);

        connectedSockets.forEach(sock => {
            if (sock.channelID === socket.channelID && sock !== socket) {
                sock.emit("join", {
                    username: socket.username,
                    pfp: socket.pfp,
                    channelName: roomName,
                    channelID: socket.channelID,
                    tags: socket.tags
                });
            }
        });

        connectedSockets.forEach(sock => {
            if (sock.channelID === socket.channelID && sock !== socket) {
                socket.emit("join", {
                    username: sock.username,
                    pfp: sock.pfp,
                    channelName: roomName,
                    channelID: socket.channelID,
                    tags: sock.tags
                });
            }
        });

        if (!existingChannel) {
            socket.isHost = true;
            channels.push({
                queue: [],
                currentlyPlaying: [],
                channelName: roomName,
                ownerName: socket.username,
                ownerPFP: socket.pfp,
                channelID: socket.channelID
            });
        }
    });

    socket.on("custom", msg => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                sock.isSpeaking = true;
                if (sock.isSpeaking && !sock.alreadySpeaking) {
                    sock.emit(
                        "notify",
                        "Voice Chat",
                        `${socket.username} joined the voice chat!`,
                        "#43b581"
                    );
                    sock.alreadySpeaking = true;
                }
                sock.emit("vc", {
                    username: socket.username,
                    vcData: msg.data.vcData
                });
            }
        });
    });

    socket.on("url", async url => {
        if (url == undefined) return;
        if (typeof url !== "string") return;
        socket.emit(
            "notify",
            "Heads up!",
            `Your video is being downloaded on the server, this may take a minute!`,
            "#43b581"
        );
        downloadYouTubeVideo(socket, url, "./movies/");
    });

    socket.on("username", ({ selfUsername, pfp }) => {
        console.log("username");
        let userPFP = pfp;
        let socketUsername = selfUsername;
        if (socketUsername == undefined) return;
        const xss = require("xss");

        socketUsername = xss(socketUsername);
        if (socketUsername.includes("<") && socketUsername.includes(">")) {
            socketUsername = socketUsername.replace("<", "");
            socketUsername = socketUsername.replace(">", "");
        }

        if (socketUsername.length > 50) return;
        if (socket.username) return;
        socket.pfp = userPFP;

        let clientIP =
            socket.handshake.headers["x-forwarded-for"] ||
            socket.handshake.address;

        socket.isSpeaking = false;
        socket.alreadySpeaking = false;
        if (host == socketUsername && clientIP == hostIP) {
            socket.isHost = true;
        }

        socket.channelName = "Lobby";
        socket.channelID = "lobby";
        connectedSockets.push(socket);
        if (!socket.friends) {
            socket.friends = [];
        }

        socket.isAdmin = false;

        socket.tags = [];

        fs.readFile("./admins.json", (err, data) => {
            data = JSON.parse(data);
            if (err) {
                console.error("Error reading admins.json:", err);
                return;
            }

            data.forEach(admin => {
                console.log(admin);
                admin.permissions.forEach(perm => {
                    if (admin.username == socketUsername && perm) {
                        console.log("Tag", perm);
                        socket.tags.push(perm);
                    }
                });
            });

            connectedSockets.forEach(sock => {
                if (sock.username == socket.username) return;
                const userIP = socket.ip;

                socket.emit(
                    "notify",
                    "Join",
                    `${sock.username} connected!`,
                    "#43b581",
                    sock.pfp,
                    sock.tags
                );
            });

            if (isFirstSocket) {
                hostIP = clientIP;
                host = socketUsername;
                isFirstSocket = false;
                if (videoData && currentlyPlaying.length > 1) {
                    socket.emit("videoData", videoData);
                    socket.emit("currentSong", {
                        title: currentlyPlaying[0].title,
                        url: currentlyPlaying[0].url,
                        author: currentlyPlaying[0].author,
                        thumbnail: currentlyPlaying[0].thumbnail
                    });
                    socket.emit("playMovie");
                    socket.emit("currentTime", currentTime);
                }
            } else if (
                !isFirstSocket &&
                host !== socket.username &&
                clientIP !== hostIP
            ) {
                if (videoData && currentlyPlaying.length > 1) {
                    socket.emit("videoData", currentlyPlaying[0].videoData);
                    socket.emit("currentSong", {
                        title: currentlyPlaying[0].title,
                        url: currentlyPlaying[0].url,
                        author: currentlyPlaying[0].author,
                        thumbnail: currentlyPlaying[0].thumbnail
                    });
                    socket.emit("playMovie");
                    socket.emit("currentTime", currentTime);
                }
            }

            socket.username = socketUsername;
            io.emit(
                "notify",
                "Join",
                `${socket.username} connected!`,
                "#43b581",
                socket.pfp,
                socket.tags
            );
            socket.emit(
                "notify",
                "Your username was set!",
                `Welcome to the YouTube room ${socketUsername}! Please use the key "/" to toggle chat!`,
                "#43b581"
            );

            let userIdentification = `${socketUsername}-${socket.pfp}`;
            fs.readFile("users.json", (err, data) => {
                let users = JSON.parse(data);
                if (!users[userIdentification]) {
                    users[userIdentification] = {
                        username: socketUsername,
                        pfp: socket.pfp,
                        friends: socket.friends
                    };
                    fs.writeFile("users.json", JSON.stringify(users), () => {});
                }
            });
        });
    });

    socket.on("pause", () => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                if (!socket.isHost) {
                    socket.emit(
                        "notify",
                        "Sorry...",
                        `Only ${host} can use this function! You can ask the pause the video if you'd like!`,
                        "#f04747"
                    );
                    return;
                }
                console.log("Pause message received");
                isPaused = true;
                sock.emit("pause");
            }
        });
    });

    socket.on("restart", () => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                if (!socket.isHost) {
                    socket.emit(
                        "notify",
                        "Sorry...",
                        `Only ${host} can use this function! You can ask the host to restart the video if you'd like!`,
                        "#f04747"
                    );
                    return;
                }
                currentTime = 0.1;
                sock.emit("sync", currentTime);
            }
        });
    });

    socket.on("sync", syncData => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                if (!socket.isHost) {
                    socket.emit(
                        "notify",
                        "Sorry...",
                        `Only ${host} can use this function! You can ask the host to sync the video if you'd like!`,
                        "#f04747"
                    );
                    return;
                }
                console.log("Sync message received");
                currentTime = syncData;
                sock.emit("sync", currentTime);
            }
        });
    });

    socket.on("play", () => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                if (!socket.isHost) {
                    socket.emit(
                        "notify",
                        "Sorry...",
                        `Only ${host} can use this function! You can ask the host to continue the video if you'd like!`,
                        "#f04747"
                    );
                    return;
                }
                console.log("Play message received");
                sock.emit("play");
            }
        });
    });

    socket.on("requestVideoData", () => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                console.log("requestVideoData message received");
                sock.emit("videoData", videoData);
            }
        });
    });

    socket.on("skip", () => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                if (!socket.isHost) {
                    socket.emit(
                        "notify",
                        "Sorry...",
                        `Only ${host} can use this function! You can ask the host to skip if you'd like!`,
                        "#f04747"
                    );
                    return;
                }
                sock.emit(
                    "notify",
                    "Heads up!",
                    `${socket.username} skipped the video!`,
                    "#43b581"
                );
                isPlaying = false;
                channels.forEach(channel => {
                    if (channel.queue.length == 0) return;
                    videoData = channel.queue[0].videoDataComplete;
                    sock.emit("queueRemove", { title: channel.queue[0].title });
                    sock.emit("currentSong", {
                        title: channel.queue[0].title,
                        url: channel.queue[0].url,
                        author: channel.queue[0].author,
                        thumbnail: channel.queue[0].thumbnail
                    });
                    channel.currentlyPlaying = [
                        {
                            title: channel.queue[0].title,
                            url: channel.queue[0].url,
                            author: channel.queue[0].author,
                            thumbnail: channel.queue[0].thumbnail,
                            videoData: channel.queue[0].videoDataComplete
                        }
                    ];
                    channel.queue.shift();
                });
                sock.emit("playMovie");
            }
        });
    });

    socket.on("requestSync", () => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                console.log(socket.username, "requested sync", currentTime);
                sock.emit("sync", currentTime);
            }
        });
    });

    const fs = require("fs");

    socket.on("admin message", ({ username, permissions, adminPassword }) => {
        let availablePermissions = [
            "Admin",
            "Owner",
            "Dev",
            "Bot",
            "Furry",
            "Cutie"
        ];

        if (!Array.isArray(permissions)) {
            socket.emit(
                "notify",
                "Whoops, that wasn't supposed to happen",
                `Server expected array of permissions!`,
                "#f04747"
            );

            return;
        }

        var userIP = "";
        if (!username) {
            socket.ip;
        } else {
            connectedSockets.forEach(sock => {
                if (sock.username == username) {
                    userIP = sock.ip;
                }
            });
        }

        fs.readFile("./admins.json", (err, data) => {
            if (err) {
                console.error("Error reading admins.json:", err);
                return;
            }

            let admins = [];
            if (data) {
                admins = JSON.parse(data);
            }

            const existingIndex = admins.findIndex(admin =>
                admin.hash.includes(
                    hashWithSalt(
                        userIP.split(", ")[0],
                        "super cali fragilistic expialidocious"
                    )
                )
            );
            if (existingIndex !== -1) {
                admins.splice(existingIndex, 1);
            }

            let newPermissions = [];
            if (
                adminPassword ===
                "snowlychat:super-secret-admin-password-secure@" +
                    currentVersion
            ) {
                permissions.forEach(permission => {
                    if (!availablePermissions.includes(permission)) {
                        socket.emit(
                            "notify",
                            "Whoops, that wasn't supposed to happen",
                            `Permission "${permission}" doesn't exist. Maybe you made a typo?`,
                            "#f04747"
                        );
                        return;
                    } else {
                        newPermissions.push(permission);
                    }
                });
            } else {
                socket.emit(
                    "notify",
                    "Whoops, that wasn't supposed to happen",
                    `"${adminPassword}" isn't the server password, sorry... Maybe you made a typo?`,
                    "#f04747"
                );
                return;
            }

            admins.push({
                permissions: newPermissions,
                hash: hashWithSalt(
                    userIP.split(", ")[0],
                    "super cali fragilistic expialidocious"
                ),
                username: username
            });

            fs.writeFile(
                "./admins.json",
                JSON.stringify(admins, null, 2),
                err => {
                    if (err) {
                        console.error("Error writing to admins.json:", err);
                        return;
                    }

                    connectedSockets.forEach(sock => {
                        if (sock.username == username) {
                            console.log(
                                `${socket.username} updated permissions for ${sock.username}`
                            );
                            socket.emit(
                                "notify",
                                "Wow, cool!",
                                `Updated permissions for ${sock.username}!`,
                                "#43b581"
                            );
                        }
                    });
                }
            );
        });
    });

    let lastCursorUpdateTime = 0;

    socket.on("Cursor Move", d => {
        const currentTime = Date.now();

        if (currentTime - lastCursorUpdateTime >= 1000 / 60) {
            connectedSockets.forEach(sock => {
                if (sock.channelID == socket.channelID) {
                    sock.emit("Update Cursor", {
                        username: socket.username,
                        cursorData: { x: d.dt.x, y: d.dt.y }
                    });
                }
            });

            lastCursorUpdateTime = currentTime;
        }
    });

    socket.on("updateSync", syncData => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                if (typeof syncData !== "string") return;
                if (syncData == undefined) return;
                if (socket.isHost) {
                    console.log(socket.username, "updated sync", syncData);
                    currentTime = syncData;
                }
            }
        });
    });

    socket.on("videoEnd", () => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                isPlaying = false;
                channels.forEach(channel => {
                    if (channel.queue.length == 0) return;
                    videoData = channel.queue[0].videoDataComplete;
                    sock.emit("queueRemove", { title: channel.queue[0].title });
                    sock.emit("currentSong", {
                        title: channel.queue[0].title,
                        url: channel.queue[0].url,
                        author: channel.queue[0].author,
                        thumbnail: channel.queue[0].thumbnail
                    });
                    channel.currentlyPlaying = [
                        {
                            videoData: channel.queue[0].videoDataComplete,
                            title: channel.queue[0].title,
                            url: channel.queue[0].url,
                            author: channel.queue[0].author,
                            thumbnail: channel.queue[0].thumbnail
                        }
                    ];
                    channel.queue.shift();
                });
                sock.emit("playMovie");
            }
        });
    });

    const xss = require("xss");

    setInterval(() => {
        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                sock.emit("updateSync");
            }
        });
    }, 5000);

    const messageCounts = {};

    socket.on("userChatMessage", msg => {
        const now = Date.now();
        const socketId = socket.id;

        if (!messageCounts[socketId]) {
            messageCounts[socketId] = { count: 0, lastMsgTime: now };
        }

        // Check if the socket is spamming
        if (
            !socket.isAdmin &&
            messageCounts[socketId].count >= 5 &&
            now - messageCounts[socketId].lastMsgTime < 4000
        ) {
            // Spam detected, don't process this message
            return;
        }

        messageCounts[socketId].count++;
        messageCounts[socketId].lastMsgTime = now;

        connectedSockets.forEach(sock => {
            if (sock.channelID == socket.channelID) {
                if (!msg || typeof msg !== "string" || msg.length > 256) {
                    return;
                }

                const json = {
                    username: "",
                    message: msg
                };

                const userIP = socket.ip;
                fs.readFile("./admins.json", (err, data) => {
                    data = JSON.parse(data);
                    if (err) {
                        console.error("Error reading admins.txt:", err);
                        return;
                    }

                    data.forEach(admin => {
                        if (
                            hashWithSalt(
                                userIP.split(", ")[0],
                                "super cali fragilistic expialidocious"
                            ) == admin.hash &&
                            admin.username == socket.username
                        ) {
                            console.log(`${socket.username} has perms!`);
                            admin.permissions.forEach(perm => {
                                if (perm == "Owner" || perm == "Admin") {
                                    socket.isAdmin = true;
                                }

                                if (!perm) return;
                                json.username += `[${perm}] `;
                            });
                        }
                    });

                    json.username += socket.isAdmin
                        ? "" + (socket.username ? socket.username : "")
                        : (socket.isHost ? "[Host] " : "") +
                          (socket.username ? socket.username : "");

                    if (msg.split(" ")[0] == ">notify" && socket.isAdmin) {
                        let parsedTitle = msg.split("title: ")[1];
                        let title = parsedTitle.split("description: ")[0];
                        let parsedDescription = msg.split("description: ")[1];
                        let description =
                            parsedDescription.split(" color: ")[0];
                        let color = msg.split("color: ")[1];

                        connectedSockets.forEach(s => {
                            if (s.channelID == socket.channelID) {
                                s.emit("notify", title, description, color);
                            }
                        });
                    } else {
                        sock.emit("chat", json);
                    }
                });
            }
        });
    });

    socket.on("disconnect", () => {
        let usernames = [];
        connectedSockets.forEach(c => {
            usernames.push(c.username);
        });

        connectedSockets.forEach(sock => {
            if (sock.channelID === socket.channelID && sock !== socket) {
                sock.emit("leave", {
                    username: socket.username,
                    pfp: socket.pfp,
                    channelName: socket.channelName,
                    channelID: socket.channelID,
                    otherUsernames: usernames
                });
            }
        });

        socket.emit("leave", {
            username: socket.username,
            pfp: socket.pfp,
            channelName: socket.channelName,
            channelID: socket.channelID,
            otherUsernames: usernames
        });

        connectedSockets.forEach((sock, index) => {
            if (sock.channelId === socket.channelID) {
                if (!socket.username) return;
                sock.emit(
                    "notify",
                    "Leave",
                    `${socket.username} disconnected!`,
                    "#43b581"
                );
            }
        });
        connectedSockets.forEach((sock, index) => {
            if (sock.username === socket.username) {
                connectedSockets.splice(index, 1);
            }
        });
    });
});

app.listen({
    port: env.PORT
});
