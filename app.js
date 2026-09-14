/* =========================================================
   PENCIL APP CONTROLLER
   Identity + PeerJS + Relay + UI Initialization
   ========================================================= */

const App = {

    peer: null,
    user: null,
    initialized: false,


    /* =====================================================
       START APPLICATION
       ===================================================== */

    init() {

        if (this.initialized) {
            return;
        }

        console.log("PENCIL: Starting...");


        /* -----------------------------------------------
           1. Check Permanent Identity
           ----------------------------------------------- */

        this.user =
            StorageManager.getUser();


        if (!this.user || !this.user.id) {

            console.warn(
                "PENCIL: Identity not found"
            );

            window.location.replace(
                "login.html"
            );

            return;
        }


        console.log(
            "PENCIL User:",
            this.user.id
        );


        /* -----------------------------------------------
           2. Update Profile UI
           ----------------------------------------------- */

        if (
            typeof ContactManager !==
            "undefined"
        ) {

            ContactManager.updateProfileUI(
                this.user
            );

            ContactManager.renderList();
        }


        /* -----------------------------------------------
           3. Initialize PeerJS
           ----------------------------------------------- */

        this.initPeer();


        /* -----------------------------------------------
           4. Start Relay
           ----------------------------------------------- */

        this.initRelay();


        /* -----------------------------------------------
           5. Bind UI
           ----------------------------------------------- */

        this.bindUI();


        this.initialized = true;

        console.log(
            "PENCIL: Application ready"
        );
    },


    /* =====================================================
       PEERJS INITIALIZATION
       ===================================================== */

    initPeer() {

        if (
            typeof Peer ===
            "undefined"
        ) {

            console.error(
                "PeerJS library not loaded"
            );

            this.updateNetworkStatus(
                "PeerJS unavailable"
            );

            return;
        }


        try {

            /*
             * IMPORTANT:
             *
             * PENCIL permanent ID is used
             * as PeerJS ID.
             */

            this.peer =
                new Peer(
                    this.user.id
                );


            /* -------------------------------------------
               Peer Open
               ------------------------------------------- */

            this.peer.on(
                "open",
                (peerId) => {

                    console.log(
                        "PENCIL P2P ID:",
                        peerId
                    );


                    this.updateNetworkStatus(
                        "P2P online"
                    );


                    /*
                     * Relay registration can now
                     * happen as well.
                     */

                    this.initRelay();
                }
            );


            /* -------------------------------------------
               Incoming P2P Connection
               ------------------------------------------- */

            this.peer.on(
                "connection",
                (connection) => {

                    console.log(
                        "Incoming P2P connection:",
                        connection.peer
                    );


                    if (
                        typeof ChatManager !==
                        "undefined"
                    ) {

                        ChatManager
                            .setupDataConnection(
                                connection
                            );
                    }
                }
            );


            /* -------------------------------------------
               Incoming Call
               ------------------------------------------- */

            this.peer.on(
                "call",
                (call) => {

                    console.log(
                        "Incoming call:",
                        call.peer
                    );


                    if (
                        typeof CallingManager !==
                        "undefined" &&
                        typeof CallingManager
                            .handleIncomingCall ===
                            "function"
                    ) {

                        CallingManager
                            .handleIncomingCall(
                                call
                            );

                    } else {

                        console.warn(
                            "CallingManager not available"
                        );
                    }
                }
            );


            /* -------------------------------------------
               Peer Error
               ------------------------------------------- */

            this.peer.on(
                "error",
                (error) => {

                    console.error(
                        "PeerJS error:",
                        error
                    );


                    this.updateNetworkStatus(
                        "P2P error"
                    );
                }
            );


            /* -------------------------------------------
               Peer Disconnected
               ------------------------------------------- */

            this.peer.on(
                "disconnected",
                () => {

                    console.warn(
                        "PENCIL P2P disconnected"
                    );


                    this.updateNetworkStatus(
                        "P2P disconnected"
                    );


                    /*
                     * Try reconnecting
                     */

                    setTimeout(() => {

                        if (
                            this.peer &&
                            !this.peer.destroyed
                        ) {

                            try {

                                this.peer.reconnect();

                            } catch (error) {

                                console.warn(
                                    "Peer reconnect failed:",
                                    error
                                );
                            }
                        }

                    }, 3000);
                }
            );


            /* -------------------------------------------
               Peer Closed
               ------------------------------------------- */

            this.peer.on(
                "close",
                () => {

                    console.warn(
                        "PENCIL Peer closed"
                    );

                    this.updateNetworkStatus(
                        "P2P offline"
                    );
                }
            );


        } catch (error) {

            console.error(
                "Peer initialization failed:",
                error
            );


            this.updateNetworkStatus(
                "P2P unavailable"
            );
        }
    },


    /* =====================================================
       RELAY INITIALIZATION
       ===================================================== */

    initRelay() {

        if (
            typeof RelayManager ===
            "undefined"
        ) {

            console.warn(
                "RelayManager not loaded"
            );

            return;
        }


        /*
         * relay.js already has automatic
         * connection logic.
         *
         * We explicitly start it here too
         * so the application controls startup.
         */

        try {

            RelayManager.loadQueue();

            RelayManager.connect();

        } catch (error) {

            console.warn(
                "Relay initialization failed:",
                error
            );
        }
    },


    /* =====================================================
       UI EVENTS
       ===================================================== */

    bindUI() {

        /* -----------------------------------------------
           Search
           ----------------------------------------------- */

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                () => {

                    ContactManager.renderList();

                }
            );
        }


        /* -----------------------------------------------
           Message Input
           ----------------------------------------------- */

        const messageInput =
            document.getElementById(
                "messageInput"
            );


        if (messageInput) {

            messageInput.addEventListener(
                "input",
                () => {

                    if (
                        typeof ChatManager !==
                        "undefined"
                    ) {

                        ChatManager
                            .handleTypingInput();
                    }
                }
            );


            messageInput.addEventListener(
                "keydown",
                (event) => {

                    /*
                     * Enter = send
                     * Shift + Enter = new line
                     */

                    if (
                        event.key ===
                        "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();


                        if (
                            typeof ChatManager !==
                            "undefined"
                        ) {

                            ChatManager
                                .sendMessage();
                        }
                    }
                }
            );
        }


        /* -----------------------------------------------
           File Input
           ----------------------------------------------- */

        const fileInput =
            document.getElementById(
                "fileInput"
            );


        if (fileInput) {

            fileInput.addEventListener(
                "change",
                (event) => {

                    const file =
                        event.target.files[0];


                    if (
                        file &&
                        typeof ChatManager !==
                        "undefined"
                    ) {

                        ChatManager
                            .sendMedia(file);
                    }


                    event.target.value = "";

                }
            );
        }
    },


    /* =====================================================
       NETWORK STATUS
       ===================================================== */

    updateNetworkStatus(status) {

        const element =
            document.getElementById(
                "networkStatus"
            );


        if (element) {

            element.textContent =
                status;
        }


        console.log(
            "PENCIL Network:",
            status
        );
    },


    /* =====================================================
       GET USER
       ===================================================== */

    getUser() {

        return this.user ||
            StorageManager.getUser();
    },


    /* =====================================================
       LOGOUT / RESET
       ===================================================== */

    logout() {

        const confirmLogout =
            confirm(
                "क्या आप PENCIL से बाहर निकलना चाहते हैं?"
            );


        if (!confirmLogout) {
            return;
        }


        /*
         * Disconnect P2P
         */

        if (
            this.peer &&
            !this.peer.destroyed
        ) {

            try {
                this.peer.destroy();
            } catch (error) {}
        }


        /*
         * Disconnect Relay
         */

        if (
            typeof RelayManager !==
            "undefined"
        ) {

            try {
                RelayManager.disconnect();
            } catch (error) {}
        }


        /*
         * Identity intentionally
         * delete नहीं कर रहे।
         *
         * Logout और permanent identity
         * अलग concepts हैं।
         */

        window.location.replace(
            "login.html"
        );
    },


    /* =====================================================
       FULL DEVICE RESET
       ===================================================== */

    resetDeviceIdentity() {

        const confirmReset =
            confirm(
                "WARNING:\n\nPermanent PENCIL ID भी delete हो जाएगी.\n\nक्या आप सच में reset करना चाहते हैं?"
            );


        if (!confirmReset) {
            return;
        }


        if (
            this.peer &&
            !this.peer.destroyed
        ) {

            try {
                this.peer.destroy();
            } catch (error) {}
        }


        if (
            typeof RelayManager !==
            "undefined"
        ) {

            try {
                RelayManager.disconnect();
            } catch (error) {}
        }


        localStorage.removeItem(
            "permanent_device_identity"
        );


        /*
         * Optional local PENCIL data cleanup
         */

        localStorage.removeItem(
            "pgn_contacts"
        );


        alert(
            "PENCIL device identity reset हो गई।"
        );


        window.location.replace(
            "login.html"
        );
    }
};


/* =========================================================
   START PENCIL
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        App.init();

    }
);
