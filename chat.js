/* =====================================================
   PENCIL
   Chat Manager
   File: chat.js
   ===================================================== */

const ChatManager = {

    activeConnection: null,
    currentPeerId: null,
    typingTimeout: null,
    reconnectTimer: null,


    /* =================================================
       OPEN CHAT
       ================================================= */

    openChat(id) {

        if (!id) {
            return;
        }

        id = String(id).trim();

        const user = StorageManager.getUser();

        // Cannot chat with yourself
        if (user && user.id === id) {
            alert("You cannot open a chat with your own ID.");
            return;
        }

        this.currentPeerId = id;

        // Make sure contact exists
        if (!StorageManager.getContact(id)) {
            StorageManager.saveContact(
                id,
                "PENCIL User",
                "IN"
            );
        }


        const emptyState =
            document.getElementById("emptyState");

        const chatView =
            document.getElementById("chatView");

        const app =
            document.getElementById("app");


        if (emptyState) {
            emptyState.style.display = "none";
        }

        if (chatView) {
            chatView.style.display = "flex";
        }

        if (app) {
            app.classList.add("chat-open");
        }


        // Contact information
        const contact =
            StorageManager.getContact(id);

        const name =
            contact?.name || "PENCIL User";


        const chatName =
            document.getElementById("chatName");

        const chatAvatar =
            document.getElementById("chatAvatar");

        const chatStatus =
            document.getElementById("chatStatus");


        if (chatName) {
            chatName.textContent = name;
        }

        if (chatAvatar) {
            chatAvatar.textContent =
                Utils.getInitials(name);
        }

        if (chatStatus) {
            chatStatus.textContent =
                "Connecting...";
        }


        // Load old messages first
        this.loadHistory(id);


        // Connect to Peer
        this.connectToPeer(id);
    },


    /* =================================================
       CLOSE CHAT
       ================================================= */

    closeChat() {

        this.currentPeerId = null;

        clearTimeout(this.typingTimeout);
        clearTimeout(this.reconnectTimer);

        const app =
            document.getElementById("app");

        const chatView =
            document.getElementById("chatView");

        const emptyState =
            document.getElementById("emptyState");


        if (app) {
            app.classList.remove("chat-open");
        }

        if (chatView) {
            chatView.style.display = "none";
        }

        if (emptyState) {
            emptyState.style.display = "flex";
        }


        const typing =
            document.getElementById("typing");

        if (typing) {
            typing.textContent = "";
        }
    },


    /* =================================================
       CONNECTION CHECK
       ================================================= */

    isConnectionOpen(id) {

        return !!(
            this.activeConnection &&
            this.activeConnection.peer === id &&
            this.activeConnection.open
        );
    },


    /* =================================================
       CONNECT TO PEER
       ================================================= */

    connectToPeer(id) {

        if (!id) {
            return;
        }


        if (this.isConnectionOpen(id)) {

            this.setChatStatus("online");

            return;
        }


        if (
            typeof App === "undefined" ||
            !App.peer
        ) {

            this.setChatStatus("Peer unavailable");

            return;
        }


        // Prevent duplicate connection
        if (
            this.activeConnection &&
            !this.activeConnection.open &&
            this.activeConnection.peer === id
        ) {
            return;
        }


        try {

            const conn =
                App.peer.connect(id, {
                    reliable: true
                });

            this.setupDataConnection(conn);

        } catch (error) {

            console.error(
                "Peer connection error:",
                error
            );

            this.setChatStatus("Connection failed");
        }
    },


    /* =================================================
       SETUP DATA CONNECTION
       ================================================= */

    setupDataConnection(conn) {

        if (!conn) {
            return;
        }


        this.activeConnection = conn;


        // Make contact available
        if (
            !StorageManager.getContact(
                conn.peer
            )
        ) {

            StorageManager.saveContact(
                conn.peer,
                "PENCIL User",
                "IN"
            );
        }


        /* ---------------------------------------------
           OPEN
           --------------------------------------------- */

        conn.on("open", () => {

            if (
                this.currentPeerId ===
                conn.peer
            ) {

                this.setChatStatus("online");
            }


            ContactManager.setOnline(
                conn.peer,
                true
            );


            ContactManager.renderList();
        });


        /* ---------------------------------------------
           DATA
           --------------------------------------------- */

        conn.on("data", data => {

            if (!data || typeof data !== "object") {
                return;
            }


            /* ---------- Text ---------- */

            if (data.type === "CHAT_MSG") {

                const text =
                    Utils.cleanText(
                        data.text,
                        5000
                    );


                if (!text) {
                    return;
                }


                StorageManager.saveMessage(
                    conn.peer,
                    "text",
                    text,
                    "received"
                );


                if (
                    this.currentPeerId ===
                    conn.peer
                ) {

                    this.renderMessage(
                        {
                            type: "text",
                            content: text,
                            time: Date.now()
                        },
                        "received"
                    );
                }
            }


            /* ---------- Typing ---------- */

            else if (
                data.type === "TYPING"
            ) {

                if (
                    this.currentPeerId ===
                    conn.peer
                ) {

                    const typing =
                        document.getElementById(
                            "typing"
                        );

                    if (typing) {

                        typing.textContent =
                            data.value
                                ? "typing..."
                                : "";
                    }
                }
            }


            /* ---------- Media ---------- */

            else if (
                data.type ===
                "MEDIA_FILE"
            ) {

                const allowed =
                    data.fileType === "image" ||
                    data.fileType === "video";


                if (!allowed || !data.data) {
                    return;
                }


                StorageManager.saveMessage(
                    conn.peer,
                    data.fileType,
                    data.data,
                    "received"
                );


                if (
                    this.currentPeerId ===
                    conn.peer
                ) {

                    this.renderMessage(
                        {
                            type: data.fileType,
                            content: data.data,
                            time: Date.now()
                        },
                        "received"
                    );
                }
            }
        });


        /* ---------------------------------------------
           CLOSE
           --------------------------------------------- */

        conn.on("close", () => {

            ContactManager.setOnline(
                conn.peer,
                false
            );


            if (
                this.currentPeerId ===
                conn.peer
            ) {

                this.setChatStatus("offline");
            }


            ContactManager.renderList();
        });


        /* ---------------------------------------------
           ERROR
           --------------------------------------------- */

        conn.on("error", error => {

            console.error(
                "Data connection error:",
                error
            );


            ContactManager.setOnline(
                conn.peer,
                false
            );


            if (
                this.currentPeerId ===
                conn.peer
            ) {

                this.setChatStatus(
                    "Connection error"
                );
            }
        });
    },


    /* =================================================
       CHAT STATUS
       ================================================= */

    setChatStatus(status) {

        const element =
            document.getElementById(
                "chatStatus"
            );

        if (element) {
            element.textContent = status;
        }
    },


    /* =================================================
       ENSURE CONNECTION
       ================================================= */

    ensureConnection(callback) {

        if (!this.currentPeerId) {

            alert(
                "पहले contact चुनें।"
            );

            return;
        }


        if (
            this.isConnectionOpen(
                this.currentPeerId
            )
        ) {

            callback();

            return;
        }


        this.connectToPeer(
            this.currentPeerId
        );


        const connection =
            this.activeConnection;


        if (!connection) {

            this.setChatStatus(
                "Connecting..."
            );

            return;
        }


        if (connection.open) {

            callback();

            return;
        }


        connection.once(
            "open",
            callback
        );


        // Connection timeout
        clearTimeout(
            this.reconnectTimer
        );


        this.reconnectTimer =
            setTimeout(() => {

                if (
                    !this.isConnectionOpen(
                        this.currentPeerId
                    )
                ) {

                    this.setChatStatus(
                        "offline"
                    );
                }

            }, 8000);
    },


    /* =================================================
       SEND TEXT MESSAGE
       ================================================= */

    sendMessage() {

        const input =
            document.getElementById(
                "messageInput"
            );


        if (!input) {
            return;
        }


        const text =
            Utils.cleanText(
                input.value,
                5000
            );


        if (!text) {
            return;
        }


        this.ensureConnection(() => {

            if (
                !this.activeConnection ||
                !this.activeConnection.open
            ) {

                return;
            }


            try {

                this.activeConnection.send({

                    type: "CHAT_MSG",

                    text: text
                });


                StorageManager.saveMessage(
                    this.currentPeerId,
                    "text",
                    text,
                    "sent"
                );


                this.renderMessage(
                    {
                        type: "text",
                        content: text,
                        time: Date.now()
                    },
                    "sent"
                );


                input.value = "";

                this.sendTyping(false);

            } catch (error) {

                console.error(
                    "Send message error:",
                    error
                );

                this.setChatStatus(
                    "Send failed"
                );
            }
        });
    },


    /* =================================================
       SEND TYPING
       ================================================= */

    sendTyping(value) {

        if (
            this.activeConnection &&
            this.activeConnection.open
        ) {

            try {

                this.activeConnection.send({

                    type: "TYPING",

                    value: !!value
                });

            } catch (error) {

                console.error(
                    "Typing error:",
                    error
                );
            }
        }
    },


    /* =================================================
       TYPING INPUT
       ================================================= */

    handleTypingInput() {

        this.sendTyping(true);


        clearTimeout(
            this.typingTimeout
        );


        this.typingTimeout =
            setTimeout(() => {

                this.sendTyping(false);

            }, 1000);
    },


    /* =================================================
       SEND MEDIA
       ================================================= */

    sendMedia(file) {

        if (!file) {
            return;
        }


        // 8 MB limit
        const MAX_SIZE =
            8 * 1024 * 1024;


        if (file.size > MAX_SIZE) {

            alert(
                "Media file 8MB से कम रखें।"
            );

            return;
        }


        if (
            !Utils.isImage(file) &&
            !Utils.isVideo(file)
        ) {

            alert(
                "केवल image या video भेज सकते हैं।"
            );

            return;
        }


        const fileType =
            Utils.isImage(file)
                ? "image"
                : "video";


        this.ensureConnection(() => {

            const reader =
                new FileReader();


            reader.onload = () => {

                if (
                    !this.activeConnection ||
                    !this.activeConnection.open
                ) {

                    return;
                }


                try {

                    const data =
                        reader.result;


                    this.activeConnection.send({

                        type: "MEDIA_FILE",

                        fileType: fileType,

                        data: data
                    });


                    StorageManager.saveMessage(
                        this.currentPeerId,
                        fileType,
                        data,
                        "sent"
                    );


                    this.renderMessage(
                        {
                            type: fileType,
                            content: data,
                            time: Date.now()
                        },
                        "sent"
                    );

                } catch (error) {

                    console.error(
                        "Media send error:",
                        error
                    );

                    alert(
                        "Media भेजने में समस्या हुई।"
                    );
                }
            };


            reader.onerror = () => {

                alert(
                    "File read नहीं हो सकी।"
                );
            };


            reader.readAsDataURL(file);
        });
    },


    /* =================================================
       LOAD CHAT HISTORY
       ================================================= */

    loadHistory(id) {

        const box =
            document.getElementById(
                "messages"
            );


        if (!box) {
            return;
        }


        box.innerHTML = "";


        const history =
            StorageManager.getChatHistory(id);


        history.forEach(item => {

            this.renderMessage(
                item,
                item.direction
            );
        });
    },


    /* =================================================
       RENDER MESSAGE
       ================================================= */

    renderMessage(item, direction) {

        if (!item || !this.currentPeerId) {
            return;
        }


        const box =
            document.getElementById(
                "messages"
            );


        if (!box) {
            return;
        }


        const bubble =
            document.createElement("div");


        bubble.className =
            "message " +
            (
                direction === "received"
                    ? "received"
                    : "sent"
            );


        /* ---------- Text ---------- */

        if (item.type === "text") {

            // textContent = safe
            bubble.textContent =
                String(
                    item.content ?? ""
                );
        }


        /* ---------- Image ---------- */

        else if (
            item.type === "image"
        ) {

            const img =
                document.createElement("img");


            img.src =
                String(item.content || "");


            img.alt =
                "Image";


            img.loading =
                "lazy";


            bubble.appendChild(img);
        }


        /* ---------- Video ---------- */

        else if (
            item.type === "video"
        ) {

            const video =
                document.createElement("video");


            video.src =
                String(item.content || "");


            video.controls = true;

            video.preload = "metadata";


            bubble.appendChild(video);
        }


        else {

            return;
        }


        /* ---------- Time ---------- */

        const small =
            document.createElement("small");


        small.textContent =
            Utils.formatTime(
                item.time
            );


        bubble.appendChild(small);


        box.appendChild(bubble);


        // Scroll to latest message
        box.scrollTop =
            box.scrollHeight;
    },


    /* =================================================
       CLEAR CURRENT CHAT
       ================================================= */

    clearCurrentChat() {

        if (!this.currentPeerId) {
            return false;
        }


        const confirmed =
            confirm(
                "इस chat की पूरी history delete करें?"
            );


        if (!confirmed) {
            return false;
        }


        StorageManager.clearChat(
            this.currentPeerId
        );


        this.loadHistory(
            this.currentPeerId
        );


        return true;
    }

};
