/* =========================================================
   PENCIL CHAT MODULE
   P2P FIRST → RELAY FALLBACK
   ========================================================= */

const ChatManager = {

    activeConnection: null,
    currentPeerId: null,
    typingTimeout: null,
    connectionTimeout: null,


    /* =====================================================
       OPEN CHAT
       ===================================================== */

    openChat(id) {

        if (!id) return;

        const user = StorageManager.getUser();

        if (user && user.id === id) {
            alert("आप अपने ही ID से chat नहीं कर सकते।");
            return;
        }

        this.currentPeerId = id;

        const contact = StorageManager.getContact(id);

        if (!contact) {
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

        if (emptyState) {
            emptyState.style.display = "none";
        }

        if (chatView) {
            chatView.style.display = "flex";
        }

        const app =
            document.getElementById("app");

        if (app) {
            app.classList.add("chat-open");
        }


        const name =
            ContactManager.getContactName(id);


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


        this.loadHistory(id);

        this.connectToPeer(id);
    },


    /* =====================================================
       CLOSE CHAT
       ===================================================== */

    closeChat() {

        this.currentPeerId = null;

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
    },


    /* =====================================================
       CONNECTION CHECK
       ===================================================== */

    isConnectionOpen(id) {

        return (
            this.activeConnection &&
            this.activeConnection.peer === id &&
            this.activeConnection.open
        );
    },


    /* =====================================================
       CONNECT P2P
       ===================================================== */

    connectToPeer(id) {

        if (!id) return;

        if (this.isConnectionOpen(id)) {

            this.setChatStatus("online");

            ContactManager.setOnline(
                id,
                true
            );

            return;
        }


        if (!App.peer) {

            this.setChatStatus(
                "Relay mode"
            );

            return;
        }


        try {

            const conn =
                App.peer.connect(
                    id,
                    {
                        reliable: true
                    }
                );

            this.setupDataConnection(conn);

        } catch (error) {

            console.warn(
                "P2P connection failed:",
                error
            );

            this.setChatStatus(
                "Relay mode"
            );
        }
    },


    /* =====================================================
       SETUP P2P CONNECTION
       ===================================================== */

    setupDataConnection(conn) {

        if (!conn) return;


        this.activeConnection = conn;


        conn.on("open", () => {

            console.log(
                "PENCIL P2P connected:",
                conn.peer
            );


            this.setChatStatus(
                "online"
            );


            ContactManager.setOnline(
                conn.peer,
                true
            );


            ContactManager.renderList();
        });


        conn.on("data", (data) => {

            this.handleIncomingData(
                conn.peer,
                data
            );
        });


        conn.on("close", () => {

            ContactManager.setOnline(
                conn.peer,
                false
            );


            if (
                this.currentPeerId ===
                conn.peer
            ) {

                this.setChatStatus(
                    "offline • Relay available"
                );
            }
        });


        conn.on("error", (error) => {

            console.warn(
                "P2P error:",
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
                    "offline • Relay"
                );
            }
        });
    },


    /* =====================================================
       INCOMING P2P DATA
       ===================================================== */

    handleIncomingData(peerId, data) {

        if (!data || !data.type) {
            return;
        }


        /* -----------------------------------------------
           TEXT
           ----------------------------------------------- */

        if (data.type === "CHAT_MSG") {

            const text =
                Utils.cleanText(
                    data.text || ""
                );

            if (!text) return;


            StorageManager.saveMessage(
                peerId,
                "text",
                text,
                "received"
            );


            if (
                this.currentPeerId ===
                peerId
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

            return;
        }


        /* -----------------------------------------------
           TYPING
           ----------------------------------------------- */

        if (data.type === "TYPING") {

            if (
                this.currentPeerId ===
                peerId
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

            return;
        }


        /* -----------------------------------------------
           MEDIA
           ----------------------------------------------- */

        if (data.type === "MEDIA_FILE") {

            if (
                data.fileType !== "image" &&
                data.fileType !== "video"
            ) {
                return;
            }


            StorageManager.saveMessage(
                peerId,
                data.fileType,
                data.data,
                "received"
            );


            if (
                this.currentPeerId ===
                peerId
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
    },


    /* =====================================================
       CHAT STATUS
       ===================================================== */

    setChatStatus(status) {

        const element =
            document.getElementById(
                "chatStatus"
            );

        if (element) {
            element.textContent = status;
        }
    },


    /* =====================================================
       ENSURE CONNECTION
       ===================================================== */

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

            callback(
                this.activeConnection
            );

            return;
        }


        /*
         * P2P available नहीं है।
         * Relay fallback इस्तेमाल होगा।
         */

        callback(null);
    },


    /* =====================================================
       SEND TEXT MESSAGE
       ===================================================== */

    sendMessage() {

        const input =
            document.getElementById(
                "messageInput"
            );


        if (!input) return;


        const text =
            Utils.cleanText(
                input.value || ""
            );


        if (!text) return;


        const receiverId =
            this.currentPeerId;


        if (!receiverId) {

            alert(
                "पहले contact चुनें।"
            );

            return;
        }


        /*
         * -----------------------------------------------
         * P2P FIRST
         * -----------------------------------------------
         */

        if (
            this.isConnectionOpen(
                receiverId
            )
        ) {

            try {

                this.activeConnection.send({

                    type: "CHAT_MSG",

                    text: text

                });


                StorageManager.saveMessage(
                    receiverId,
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

                return;

            } catch (error) {

                console.warn(
                    "P2P send failed:",
                    error
                );
            }
        }


        /*
         * -----------------------------------------------
         * RELAY FALLBACK
         * -----------------------------------------------
         */

        const relaySent =
            RelayManager.sendMessage(
                receiverId,
                {
                    type: "CHAT_MSG",
                    text: text
                }
            );


        /*
         * Local history
         */

        StorageManager.saveMessage(
            receiverId,
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


        if (relaySent) {

            this.setChatStatus(
                "sent via relay"
            );

        } else {

            this.setChatStatus(
                "queued • relay offline"
            );
        }
    },


    /* =====================================================
       RECEIVE RELAY MESSAGE
       ===================================================== */

    receiveRelayMessage(message) {

        if (!message) return;


        const senderId =
            message.senderId;


        if (!senderId) return;


        const data =
            message.data;


        if (!data || !data.type) {
            return;
        }


        /* -----------------------------------------------
           TEXT
           ----------------------------------------------- */

        if (
            data.type ===
            "CHAT_MSG"
        ) {

            const text =
                Utils.cleanText(
                    data.text || ""
                );


            if (!text) return;


            StorageManager.saveMessage(
                senderId,
                "text",
                text,
                "received"
            );


            /*
             * Contact automatically create
             */

            StorageManager.saveContact(
                senderId,
                ContactManager.getContactName(
                    senderId
                ),
                "IN"
            );


            if (
                this.currentPeerId ===
                senderId
            ) {

                this.renderMessage(
                    {
                        type: "text",
                        content: text,
                        time: Date.now()
                    },
                    "received"
                );


                this.setChatStatus(
                    "online"
                );
            }

            return;
        }


        /* -----------------------------------------------
           MEDIA
           ----------------------------------------------- */

        if (
            data.type ===
            "MEDIA_FILE"
        ) {

            if (
                data.fileType !== "image" &&
                data.fileType !== "video"
            ) {
                return;
            }


            StorageManager.saveMessage(
                senderId,
                data.fileType,
                data.data,
                "received"
            );


            if (
                this.currentPeerId ===
                senderId
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
    },


    /* =====================================================
       TYPING
       ===================================================== */

    sendTyping(value) {

        if (
            this.isConnectionOpen(
                this.currentPeerId
            )
        ) {

            try {

                this.activeConnection.send({

                    type: "TYPING",

                    value: value

                });

            } catch (error) {

                console.warn(
                    "Typing send error:",
                    error
                );
            }
        }

        /*
         * Typing indicator intentionally
         * relay नहीं किया गया है।
         */
    },


    /* =====================================================
       HANDLE TYPING INPUT
       ===================================================== */

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


    /* =====================================================
       SEND MEDIA
       ===================================================== */

    sendMedia(file) {

        if (!file) return;


        const receiverId =
            this.currentPeerId;


        if (!receiverId) {

            alert(
                "पहले contact चुनें।"
            );

            return;
        }


        /*
         * 8 MB limit
         */

        if (
            file.size >
            8 * 1024 * 1024
        ) {

            alert(
                "Media 8MB से कम रखें।"
            );

            return;
        }


        /*
         * Only image/video
         */

        let fileType = null;


        if (
            Utils.isImage(file)
        ) {

            fileType = "image";

        } else if (
            Utils.isVideo(file)
        ) {

            fileType = "video";

        } else {

            alert(
                "केवल image या video भेज सकते हैं।"
            );

            return;
        }


        const reader =
            new FileReader();


        reader.onload = () => {

            const data = {

                type: "MEDIA_FILE",

                fileType: fileType,

                data: reader.result
            };


            /*
             * P2P FIRST
             */

            if (
                this.isConnectionOpen(
                    receiverId
                )
            ) {

                try {

                    this.activeConnection.send(
                        data
                    );


                    StorageManager.saveMessage(
                        receiverId,
                        fileType,
                        reader.result,
                        "sent"
                    );


                    this.renderMessage(
                        {
                            type: fileType,
                            content: reader.result,
                            time: Date.now()
                        },
                        "sent"
                    );


                    return;

                } catch (error) {

                    console.warn(
                        "P2P media failed:",
                        error
                    );
                }
            }


            /*
             * RELAY FALLBACK
             */

            const relaySent =
                RelayManager.sendMessage(
                    receiverId,
                    data
                );


            StorageManager.saveMessage(
                receiverId,
                fileType,
                reader.result,
                "sent"
            );


            this.renderMessage(
                {
                    type: fileType,
                    content: reader.result,
                    time: Date.now()
                },
                "sent"
            );


            if (relaySent) {

                this.setChatStatus(
                    "media sent via relay"
                );

            } else {

                this.setChatStatus(
                    "media queued"
                );
            }
        };


        reader.readAsDataURL(file);
    },


    /* =====================================================
       LOAD CHAT HISTORY
       ===================================================== */

    loadHistory(id) {

        const box =
            document.getElementById(
                "messages"
            );


        if (!box) return;


        box.innerHTML = "";


        const history =
            StorageManager.getChatHistory(
                id
            );


        history.forEach(item => {

            this.renderMessage(
                item,
                item.direction
            );

        });
    },


    /* =====================================================
       RENDER MESSAGE
       ===================================================== */

    renderMessage(item, direction) {

        if (
     
