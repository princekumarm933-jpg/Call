/* =========================================================
   PENCIL RELAY MODULE
   P2P First → Relay Fallback
   ========================================================= */

const RelayManager = {

    // Relay server URL
    serverUrl: "wss://YOUR-RELAY-SERVER.example.com",

    socket: null,
    connected: false,
    pendingMessages: [],

    /* -----------------------------------------------------
       Connect to Relay Server
       ----------------------------------------------------- */
    connect() {

        if (this.connected || this.socket) {
            return;
        }

        try {

            this.socket = new WebSocket(this.serverUrl);

            this.socket.onopen = () => {

                this.connected = true;

                console.log("PENCIL Relay: Connected");

                this.registerDevice();

                this.sendPendingMessages();
            };

            this.socket.onmessage = (event) => {

                this.handleMessage(event.data);

            };

            this.socket.onerror = (error) => {

                console.warn("PENCIL Relay: Connection error", error);

            };

            this.socket.onclose = () => {

                this.connected = false;
                this.socket = null;

                console.log("PENCIL Relay: Disconnected");

                // Retry after 5 seconds
                setTimeout(() => {
                    this.connect();
                }, 5000);
            };

        } catch (error) {

            console.error("PENCIL Relay error:", error);

            this.connected = false;
            this.socket = null;
        }
    },


    /* -----------------------------------------------------
       Register Current Device
       ----------------------------------------------------- */
    registerDevice() {

        if (!this.connected || !this.socket) {
            return;
        }

        const user = StorageManager.getUser();

        if (!user || !user.id) {
            console.warn("PENCIL Relay: User identity missing");
            return;
        }

        this.send({
            type: "REGISTER",
            userId: user.id
        });
    },


    /* -----------------------------------------------------
       Send Data to Relay Server
       ----------------------------------------------------- */
    send(data) {

        if (!this.connected || !this.socket) {
            return false;
        }

        try {

            this.socket.send(JSON.stringify(data));

            return true;

        } catch (error) {

            console.error("PENCIL Relay send error:", error);

            return false;
        }
    },


    /* -----------------------------------------------------
       Queue Message When Relay Offline
       ----------------------------------------------------- */
    queueMessage(message) {

        this.pendingMessages.push(message);

        try {

            localStorage.setItem(
                "pencil_relay_queue",
                JSON.stringify(this.pendingMessages)
            );

        } catch (error) {

            console.warn("Relay queue storage error:", error);
        }
    },


    /* -----------------------------------------------------
       Load Pending Messages
       ----------------------------------------------------- */
    loadQueue() {

        try {

            const saved = localStorage.getItem(
                "pencil_relay_queue"
            );

            this.pendingMessages = saved
                ? JSON.parse(saved)
                : [];

        } catch (error) {

            this.pendingMessages = [];
        }
    },


    /* -----------------------------------------------------
       Send Pending Messages
       ----------------------------------------------------- */
    sendPendingMessages() {

        if (!this.connected) {
            return;
        }

        this.loadQueue();

        if (!this.pendingMessages.length) {
            return;
        }

        const remaining = [];

        this.pendingMessages.forEach(message => {

            const sent = this.send({
                type: "RELAY_MESSAGE",
                message: message
            });

            if (!sent) {
                remaining.push(message);
            }
        });

        this.pendingMessages = remaining;

        localStorage.setItem(
            "pencil_relay_queue",
            JSON.stringify(this.pendingMessages)
        );
    },


    /* -----------------------------------------------------
       Send Offline Message
       ----------------------------------------------------- */
    sendMessage(receiverId, messageData) {

        if (!receiverId || !messageData) {
            return false;
        }

        const user = StorageManager.getUser();

        if (!user || !user.id) {
            return false;
        }

        const message = {

            messageId:
                "MSG-" +
                Date.now() +
                "-" +
                Utils.randomString(8),

            senderId: user.id,

            receiverId: receiverId,

            data: messageData,

            timestamp: Date.now()
        };


        // Try Relay Server first
        if (this.connected) {

            const sent = this.send({

                type: "RELAY_MESSAGE",

                message: message
            });

            if (sent) {
                return true;
            }
        }


        // Relay unavailable → local queue
        this.queueMessage(message);

        return false;
    },


    /* -----------------------------------------------------
       Incoming Relay Message
       ----------------------------------------------------- */
    handleMessage(rawData) {

        let packet;

        try {

            packet = JSON.parse(rawData);

        } catch (error) {

            console.warn(
                "PENCIL Relay: Invalid packet"
            );

            return;
        }


        if (!packet || !packet.type) {
            return;
        }


        switch (packet.type) {

            case "RELAY_MESSAGE":

                this.receiveMessage(packet.message);

                break;


            case "REGISTERED":

                console.log(
                    "PENCIL Relay: Device registered"
                );

                break;


            case "ACK":

                console.log(
                    "PENCIL Relay: Message delivered"
                );

                break;


            case "PENDING_MESSAGES":

                if (Array.isArray(packet.messages)) {

                    packet.messages.forEach(message => {

                        this.receiveMessage(message);

                    });
                }

                break;
        }
    },


    /* -----------------------------------------------------
       Receive Message
       ----------------------------------------------------- */
    receiveMessage(message) {

        if (!message) {
            return;
        }

        console.log(
            "PENCIL Relay: Message received",
            message
        );


        // Duplicate protection
        const key =
            "pencil_received_" +
            message.messageId;

        if (localStorage.getItem(key)) {
            return;
        }

        localStorage.setItem(key, "1");


        // Deliver to ChatManager
        if (
            typeof ChatManager !== "undefined" &&
            typeof ChatManager.receiveRelayMessage === "function"
        ) {

            ChatManager.receiveRelayMessage(message);

        }
    },


    /* -----------------------------------------------------
       Relay Status
       ----------------------------------------------------- */
    isOnline() {

        return this.connected === true;
    },


    /* -----------------------------------------------------
       Disconnect
       ----------------------------------------------------- */
    disconnect() {

        if (this.socket) {

            this.socket.close();

        }

        this.socket = null;
        this.connected = false;
    }
};


/* =========================================================
   AUTO START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    RelayManager.loadQueue();

    // Give app.js time to load identity
    setTimeout(() => {

        RelayManager.connect();

    }, 1000);

});
