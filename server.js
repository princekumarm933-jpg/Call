/*
=========================================================
 PENCIL RELAY SERVER
 P2P FIRST → RELAY FALLBACK
=========================================================
*/

const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

// Offline message कितने समय तक रखना है
const MESSAGE_TTL = 24 * 60 * 60 * 1000; // 24 hours


// -------------------------------------------------------
// WebSocket Server
// -------------------------------------------------------

const server = new WebSocket.Server({
    port: PORT
});


// -------------------------------------------------------
// Online Users
//
// userId -> WebSocket
// -------------------------------------------------------

const onlineUsers = new Map();


// -------------------------------------------------------
// Offline Messages
//
// receiverId -> Array of messages
// -------------------------------------------------------

const offlineMessages = new Map();


// -------------------------------------------------------
// Processed Message IDs
//
// Duplicate protection
// -------------------------------------------------------

const processedMessages = new Map();


console.log("====================================");
console.log(" PENCIL RELAY SERVER");
console.log("====================================");
console.log("Server running on port:", PORT);


// -------------------------------------------------------
// Connection
// -------------------------------------------------------

server.on("connection", (socket) => {

    console.log("New connection");

    let currentUserId = null;


    // ---------------------------------------------------
    // Incoming data
    // ---------------------------------------------------

    socket.on("message", (rawData) => {

        let packet;

        try {

            packet = JSON.parse(rawData.toString());

        } catch (error) {

            send(socket, {
                type: "ERROR",
                message: "Invalid JSON packet"
            });

            return;
        }


        if (!packet || !packet.type) {

            send(socket, {
                type: "ERROR",
                message: "Invalid packet"
            });

            return;
        }


        // ------------------------------------------------
        // REGISTER
        // ------------------------------------------------

        if (packet.type === "REGISTER") {

            registerUser(
                socket,
                packet.userId
            );

            currentUserId = packet.userId;

            return;
        }


        // ------------------------------------------------
        // RELAY MESSAGE
        // ------------------------------------------------

        if (packet.type === "RELAY_MESSAGE") {

            relayMessage(
                socket,
                packet.message
            );

            return;
        }


        // ------------------------------------------------
        // PING
        // ------------------------------------------------

        if (packet.type === "PING") {

            send(socket, {
                type: "PONG",
                timestamp: Date.now()
            });

            return;
        }

    });


    // ---------------------------------------------------
    // Connection closed
    // ---------------------------------------------------

    socket.on("close", () => {

        if (
            currentUserId &&
            onlineUsers.get(currentUserId) === socket
        ) {

            onlineUsers.delete(currentUserId);

            console.log(
                "User offline:",
                currentUserId
            );
        }

    });


    // ---------------------------------------------------
    // Error
    // ---------------------------------------------------

    socket.on("error", (error) => {

        console.log(
            "Socket error:",
            error.message
        );

    });

});


// =======================================================
// REGISTER USER
// =======================================================

function registerUser(socket, userId) {

    if (!userId || typeof userId !== "string") {

        send(socket, {
            type: "ERROR",
            message: "Invalid User ID"
        });

        return;
    }


    // Remove old connection
    const oldSocket = onlineUsers.get(userId);

    if (oldSocket && oldSocket !== socket) {

        try {
            oldSocket.close();
        } catch (error) {}

    }


    onlineUsers.set(userId, socket);


    console.log(
        "User registered:",
        userId
    );


    send(socket, {

        type: "REGISTERED",

        userId: userId,

        timestamp: Date.now()

    });


    // ---------------------------------------------------
    // Send offline messages
    // ---------------------------------------------------

    deliverPendingMessages(
        userId,
        socket
    );
}


// =======================================================
// RELAY MESSAGE
// =======================================================

function relayMessage(socket, message) {

    if (!message) {

        send(socket, {
            type: "ERROR",
            message: "Message missing"
        });

        return;
    }


    const senderId = message.senderId;
    const receiverId = message.receiverId;
    const messageId = message.messageId;


    // ---------------------------------------------------
    // Basic validation
    // ---------------------------------------------------

    if (
        !senderId ||
        !receiverId ||
        !messageId
    ) {

        send(socket, {
            type: "ERROR",
            message: "Invalid message"
        });

        return;
    }


    // ---------------------------------------------------
    // Duplicate protection
    // ---------------------------------------------------

    if (processedMessages.has(messageId)) {

        send(socket, {

            type: "ACK",

            messageId: messageId,

            status: "duplicate"

        });

        return;
    }


    processedMessages.set(
        messageId,
        Date.now()
    );


    // ---------------------------------------------------
    // Receiver online?
    // ---------------------------------------------------

    const receiverSocket =
        onlineUsers.get(receiverId);


    if (
        receiverSocket &&
        receiverSocket.readyState === WebSocket.OPEN
    ) {

        send(
            receiverSocket,
            {
                type: "RELAY_MESSAGE",
                message: message
            }
        );


        // ACK sender

        send(socket, {

            type: "ACK",

            messageId: messageId,

            status: "delivered"

        });


        console.log(
            "Message delivered:",
            senderId,
            "→",
            receiverId
        );

        return;
    }


    // ---------------------------------------------------
    // Receiver offline
    // ---------------------------------------------------

    if (!offlineMessages.has(receiverId)) {

        offlineMessages.set(
            receiverId,
            []
        );

    }


    offlineMessages
        .get(receiverId)
        .push({
            message: message,
            storedAt: Date.now()
        });


    send(socket, {

        type: "ACK",

        messageId: messageId,

        status: "stored"

    });


    console.log(
        "Message stored:",
        senderId,
        "→",
        receiverId
    );
}


// =======================================================
// DELIVER PENDING MESSAGES
// =======================================================

function deliverPendingMessages(
    userId,
    socket
) {

    const queue =
        offlineMessages.get(userId);


    if (!queue || queue.length === 0) {

        return;
    }


    const validMessages = [];


    for (const item of queue) {

        const age =
            Date.now() - item.storedAt;


        // Expired
        if (age > MESSAGE_TTL) {

            continue;
        }


        send(socket, {

            type: "RELAY_MESSAGE",

            message: item.message

        });


        validMessages.push(
            item.message.messageId
        );
    }


    // Queue clear
    offlineMessages.delete(userId);


    console.log(
        "Pending messages delivered:",
        userId,
        validMessages.length
    );
}


// =======================================================
// SEND HELPER
// =======================================================

function send(socket, data) {

    if (
        !socket ||
        socket.readyState !== WebSocket.OPEN
    ) {

        return false;
    }


    try {

        socket.send(
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.log(
            "Send error:",
            error.message
        );

        return false;
    }
}


// =======================================================
// CLEANUP
// =======================================================

setInterval(() => {

    const now = Date.now();


    // ---------------------------------------------------
    // Clean processed message IDs
    // ---------------------------------------------------

    for (
        const [messageId, timestamp]
        of processedMessages
    ) {

        if (
            now - timestamp >
            MESSAGE_TTL
        ) {

            processedMessages.delete(
                messageId
            );
        }
    }


    // ---------------------------------------------------
    // Clean offline messages
    // ---------------------------------------------------

    for (
        const [userId, messages]
        of offlineMessages
    ) {

        const valid = messages.filter(
            item =>
                now - item.storedAt <
                MESSAGE_TTL
        );


        if (valid.length === 0) {

            offlineMessages.delete(
                userId
            );

        } else {

            offlineMessages.set(
                userId,
                valid
            );
        }
    }

}, 60 * 60 * 1000);


// =======================================================
// SERVER ERROR
// =======================================================

server.on("error", (error) => {

    console.error(
        "Relay Server Error:",
        error
    );

});
