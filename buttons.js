/* =========================================================
   PENCIL BUTTON CONTROLLER
   UI Buttons + Navigation + Profile + Tabs + Attachments
   ========================================================= */

const ButtonManager = {

    /* =====================================================
       INITIALIZE
       ===================================================== */

    init() {

        console.log("PENCIL Buttons: Initializing...");

        this.bindButtons();
        this.bindTabs();
        this.bindProfile();
        this.bindChatControls();

        console.log("PENCIL Buttons: Ready");
    },


    /* =====================================================
       ALL BUTTONS
       ===================================================== */

    bindButtons() {

        /* -----------------------------------------------
           Back Button
           ----------------------------------------------- */

        const backBtn =
            document.getElementById("backBtn");

        if (backBtn) {

            backBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof ChatManager !==
                        "undefined"
                    ) {

                        ChatManager.closeChat();
                    }
                }
            );
        }


        /* -----------------------------------------------
           Send Button
           ----------------------------------------------- */

        const sendBtn =
            document.getElementById("sendBtn");

        if (sendBtn) {

            sendBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof ChatManager !==
                        "undefined"
                    ) {

                        ChatManager.sendMessage();
                    }
                }
            );
        }


        /* -----------------------------------------------
           Attach Button
           ----------------------------------------------- */

        const attachBtn =
            document.getElementById("attachBtn");

        const fileInput =
            document.getElementById("fileInput");

        if (
            attachBtn &&
            fileInput
        ) {

            attachBtn.addEventListener(
                "click",
                () => {

                    fileInput.click();

                }
            );
        }


        /* -----------------------------------------------
           Clear Chat
           ----------------------------------------------- */

        const clearChatBtn =
            document.getElementById(
                "clearChatBtn"
            );

        if (clearChatBtn) {

            clearChatBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof ChatManager !==
                        "undefined"
                    ) {

                        ChatManager.clearCurrentChat();
                    }
                }
            );
        }


        /* -----------------------------------------------
           Logout
           ----------------------------------------------- */

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                () => {

                    App.logout();

                }
            );
        }


        /* -----------------------------------------------
           Reset Identity
           ----------------------------------------------- */

        const resetBtn =
            document.getElementById(
                "resetIdentityBtn"
            );

        if (resetBtn) {

            resetBtn.addEventListener(
                "click",
                () => {

                    App.resetDeviceIdentity();

                }
            );
        }


        /* -----------------------------------------------
           Copy PENCIL ID
           ----------------------------------------------- */

        const copyIdBtn =
            document.getElementById(
                "copyIdBtn"
            );

        if (copyIdBtn) {

            copyIdBtn.addEventListener(
                "click",
                async () => {

                    const user =
                        StorageManager.getUser();

                    if (
                        user &&
                        user.id
                    ) {

                        const success =
                            await Utils.copyText(
                                user.id
                            );


                        if (success) {

                            this.showToast(
                                "PENCIL ID copied"
                            );

                        } else {

                            this.showToast(
                                "Copy failed"
                            );
                        }
                    }
                }
            );
        }


        /* -----------------------------------------------
           Add Contact
           ----------------------------------------------- */

        const addContactBtn =
            document.getElementById(
                "addContactBtn"
            );

        if (addContactBtn) {

            addContactBtn.addEventListener(
                "click",
                () => {

                    this.addContactDialog();

                }
            );
        }


        /* -----------------------------------------------
           Delete Contact
           ----------------------------------------------- */

        const deleteContactBtn =
            document.getElementById(
                "deleteContactBtn"
            );

        if (deleteContactBtn) {

            deleteContactBtn.addEventListener(
                "click",
                () => {

                    this.deleteCurrentContact();

                }
            );
        }
    },


    /* =====================================================
       CHAT CALL BUTTONS
       ===================================================== */

    bindChatControls() {

        /* -----------------------------------------------
           Audio Call
           ----------------------------------------------- */

        const audioCallBtn =
            document.getElementById(
                "audioCallBtn"
            );

        if (audioCallBtn) {

            audioCallBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof CallingManager !==
                        "undefined" &&
                        typeof CallingManager
                            .startAudioCall ===
                            "function"
                    ) {

                        CallingManager
                            .startAudioCall(
                                ChatManager.currentPeerId
                            );
                    }
                }
            );
        }


        /* -----------------------------------------------
           Video Call
           ----------------------------------------------- */

        const videoCallBtn =
            document.getElementById(
                "videoCallBtn"
            );

        if (videoCallBtn) {

            videoCallBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof CallingManager !==
                        "undefined" &&
                        typeof CallingManager
                            .startVideoCall ===
                            "function"
                    ) {

                        CallingManager
                            .startVideoCall(
                                ChatManager.currentPeerId
                            );
                    }
                }
            );
        }


        /* -----------------------------------------------
           End Call
           ----------------------------------------------- */

        const endCallBtn =
            document.getElementById(
                "endCallBtn"
            );

        if (endCallBtn) {

            endCallBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof CallingManager !==
                        "undefined" &&
                        typeof CallingManager
                            .endCall ===
                            "function"
                    ) {

                        CallingManager.endCall();
                    }
                }
            );
        }


        /* -----------------------------------------------
           Mute
           ----------------------------------------------- */

        const muteBtn =
            document.getElementById(
                "muteBtn"
            );

        if (muteBtn) {

            muteBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof CallingManager !==
                        "undefined" &&
                        typeof CallingManager
                            .toggleMute ===
                            "function"
                    ) {

                        CallingManager
                            .toggleMute();
                    }
                }
            );
        }


        /* -----------------------------------------------
           Camera
           ----------------------------------------------- */

        const cameraBtn =
            document.getElementById(
                "cameraBtn"
            );

        if (cameraBtn) {

            cameraBtn.addEventListener(
                "click",
                () => {

                    if (
                        typeof CallingManager !==
                        "undefined" &&
                        typeof CallingManager
                            .toggleCamera ===
                            "function"
                    ) {

                        CallingManager
                            .toggleCamera();
                    }
                }
            );
        }
    },


    /* =====================================================
       TABS
       ===================================================== */

    bindTabs() {

        const tabButtons =
            document.querySelectorAll(
                "[data-tab]"
            );


        tabButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const tab =
                            button.dataset.tab;

                        this.switchTab(
                            tab
                        );

                    }
                );
            }
        );
    },


    /* =====================================================
       SWITCH TAB
       ===================================================== */

    switchTab(tab) {

        if (!tab) return;


        if (
            typeof ContactManager !==
            "undefined"
        ) {

            ContactManager.currentTab =
                tab;
        }


        const tabs =
            document.querySelectorAll(
                "[data-tab]"
            );


        tabs.forEach(
            (button) => {

                button.classList.toggle(
                    "active",
                    button.dataset.tab ===
                    tab
                );
            }
        );


        /*
         * फिलहाल chats / contacts / calls
         * एक ही contact list use कर सकते हैं।
         *
         * आगे अलग CallsManager आने पर
         * Calls tab को अलग बनाया जा सकता है।
         */

        if (
            typeof ContactManager !==
            "undefined"
        ) {

            ContactManager.renderList();
        }
    },


    /* =====================================================
       PROFILE
       ===================================================== */

    bindProfile() {

        const profileMini =
            document.getElementById(
                "profileMini"
            );

        const profilePanel =
            document.getElementById(
                "profilePanel"
            );

        const closeProfileBtn =
            document.getElementById(
                "closeProfileBtn"
            );


        /* -----------------------------------------------
           Open Profile
           ----------------------------------------------- */

        if (
            profileMini &&
            profilePanel
        ) {

            profileMini.addEventListener(
                "click",
                () => {

                    profilePanel.classList.add(
                        "open"
                    );

                }
            );
        }


        /* -----------------------------------------------
           Close Profile
           ----------------------------------------------- */

        if (
            closeProfileBtn &&
            profilePanel
        ) {

            closeProfileBtn.addEventListener(
                "click",
                () => {

                    profilePanel.classList.remove(
                        "open"
                    );

                }
            );
        }


        /* -----------------------------------------------
           Edit Profile
           ----------------------------------------------- */

        const editProfileBtn =
            document.getElementById(
                "editProfileBtn"
            );

        if (editProfileBtn) {

            editProfileBtn.addEventListener(
                "click",
                () => {

                    this.editProfile();

                }
            );
        }
    },


    /* =====================================================
       EDIT PROFILE
       ===================================================== */

    editProfile() {

        const user =
            StorageManager.getUser();


        if (!user) {
            return;
        }


        const name =
            prompt(
                "Display Name:",
                user.name || ""
            );


        if (
            name === null
        ) {
            return;
        }


        const cleanName =
            Utils.cleanName(
                name
            );


        if (!cleanName) {

            alert(
                "Valid name enter करें।"
            );

            return;
        }


        const success =
            StorageManager.updateUser(
                cleanName,
                user.state
            );


        if (!success) {

            alert(
                "Profile update failed."
            );

            return;
        }


        /*
         * IMPORTANT:
         *
         * ID को touch नहीं किया गया।
         *
         * सिर्फ display name बदला।
         */


        App.user =
            StorageManager.getUser();


        ContactManager.updateProfileUI(
            App.user
        );


        this.showToast(
            "Profile updated"
        );
    },


    /* =====================================================
       ADD CONTACT DIALOG
       ===================================================== */

    addContactDialog() {

        const id =
            prompt(
                "PENCIL User ID डालें:"
            );


        if (
            id === null
        ) {
            return;
        }


        const cleanId =
            id.trim().toUpperCase();


        if (
            !Utils.isValidPencilId(
                cleanId
            )
        ) {

            alert(
                "Invalid PENCIL ID.\n\nExample:\nIN-BR-7F3A91C2"
            );

            return;
        }


        const user =
            StorageManager.getUser();


        if (
            user &&
            user.id === cleanId
        ) {

            alert(
                "आप अपना खुद का ID add नहीं कर सकते।"
            );

            return;
        }


        const name =
            prompt(
                "Contact का display name:",
                "PENCIL User"
            );


        const cleanName =
            Utils.cleanName(
                name || "PENCIL User"
            );


        const result =
            ContactManager.addContact(
                cleanId,
                cleanName,
                "IN"
            );


        if (result.success) {

            this.showToast(
                "Contact added"
            );

        } else {

            alert(
                result.message ||
                "Contact add failed."
            );
        }
    },


    /* =====================================================
       DELETE CURRENT CONTACT
       ===================================================== */

    deleteCurrentContact() {

        const id =
            ChatManager.currentPeerId;


        if (!id) {

            alert(
                "पहले contact select करें।"
            );

            return;
        }


        const name =
            ContactManager.getContactName(
                id
            );


        const confirmed =
            confirm(
                `"${name}" को contacts से delete करें?`
            );


        if (!confirmed) {
            return;
        }


        ContactManager.deleteContact(
            id
        );


        ChatManager.closeChat();


        this.showToast(
            "Contact deleted"
        );
    },


    /* =====================================================
       TOAST
       ===================================================== */

    showToast(message) {

        let toast =
            document.getElementById(
                "pencilToast"
            );


        if (!toast) {

            toast =
                document.createElement(
                    "div"
                );

            toast.id =
                "pencilToast";


            toast.style.position =
                "fixed";

            toast.style.bottom =
                "25px";

            toast.style.left =
                "50%";

            toast.style.transform =
                "translateX(-50%)";

            toast.style.zIndex =
                "99999";

            toast.style.padding =
                "10px 18px";

            toast.style.borderRadius =
                "20px";

            toast.style.background =
                "#111";

            toast.style.color =
                "#00ff66";

            toast.style.border =
                "1px solid #00ff66";

            toast.style.fontFamily =
                "monospace";

            document.body.appendChild(
                toast
            );
        }


        toast.textContent =
            message;


        toast.style.display =
            "block";


        clearTimeout(
            this.toastTimer
        );


        this.toastTimer =
            setTimeout(
                () => {

                    toast.style.display =
                        "none";

                },
                2200
            );
    }
};


/* =========================================================
   INITIALIZE BUTTON MANAGER
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        ButtonManager.init();

    }
);
