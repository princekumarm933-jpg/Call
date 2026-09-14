/* =====================================================
   PENCIL
   Contact Manager
   File: contacts.js
   ===================================================== */

const ContactManager = {

    currentTab: "chats",


    /* =================================================
       GET CONTACT
       ================================================= */

    getContact(id) {

        if (!id) {
            return null;
        }

        return StorageManager.getContact(id);
    },


    /* =================================================
       GET CONTACT NAME
       ================================================= */

    getContactName(id) {

        const contact = this.getContact(id);

        if (!contact) {
            return id || "PENCIL User";
        }

        return contact.name || "PENCIL User";
    },


    /* =================================================
       ADD CONTACT
       ================================================= */

    addContact(id, name = "PENCIL User", state = "IN") {

        id = String(id || "").trim();

        name = Utils.cleanName(name);

        state = Utils.cleanState(state) || "IN";


        // Empty ID
        if (!id) {
            return {
                success: false,
                message: "Peer ID is required."
            };
        }


        // Invalid PENCIL ID
        if (!Utils.isValidPencilId(id)) {
            return {
                success: false,
                message: "Invalid PENCIL ID."
            };
        }


        // Current user
        const user = StorageManager.getUser();

        if (user && user.id === id) {
            return {
                success: false,
                message: "You cannot add your own ID."
            };
        }


        // Save
        const saved = StorageManager.saveContact(
            id,
            name || "PENCIL User",
            state
        );


        if (!saved) {
            return {
                success: false,
                message: "Contact could not be added."
            };
        }


        this.renderList();


        return {
            success: true,
            message: "Contact added successfully."
        };
    },


    /* =================================================
       DELETE CONTACT
       ================================================= */

    deleteContact(id) {

        if (!id) {
            return false;
        }

        const deleted =
            StorageManager.deleteContact(id);

        if (deleted) {
            this.renderList();
        }

        return deleted;
    },


    /* =================================================
       SEARCH
       ================================================= */

    matchesSearch(contact, search) {

        if (!search) {
            return true;
        }

        const name =
            String(contact.name || "").toLowerCase();

        const id =
            String(contact.id || "").toLowerCase();

        const state =
            String(contact.state || "").toLowerCase();

        return (
            name.includes(search) ||
            id.includes(search) ||
            state.includes(search)
        );
    },


    /* =================================================
       RENDER CONTACT LIST
       ================================================= */

    renderList() {

        const list =
            document.getElementById("list");

        if (!list) {
            return;
        }


        list.innerHTML = "";


        const searchInput =
            document.getElementById("searchInput");

        const search = searchInput
            ? String(searchInput.value || "")
                .trim()
                .toLowerCase()
            : "";


        const contacts =
            StorageManager.getContacts();


        const ids =
            Object.keys(contacts);


        /* ---------------------------------------------
           EMPTY STATE
           --------------------------------------------- */

        if (!ids.length) {

            list.innerHTML = `
                <div class="empty-contact">
                    <div class="empty-contact-icon">✎</div>
                    <div class="empty-contact-title">
                        No contacts yet
                    </div>
                    <div class="empty-contact-text">
                        Add a PENCIL ID to start chatting.
                    </div>
                </div>
            `;

            return;
        }


        let visibleCount = 0;


        /* ---------------------------------------------
           CONTACTS
           --------------------------------------------- */

        ids.forEach(id => {

            const contact = contacts[id];

            if (!contact) {
                return;
            }


            if (!this.matchesSearch(
                contact,
                search
            )) {
                return;
            }


            visibleCount++;


            const item =
                document.createElement("div");

            item.className = "item";

            item.dataset.contactId = id;


            /* ---------- Avatar ---------- */

            const avatar =
                document.createElement("div");

            avatar.className = "avatar";

            avatar.textContent =
                Utils.getInitials(
                    contact.name || "PENCIL User"
                );


            /* ---------- Main ---------- */

            const main =
                document.createElement("div");

            main.className = "item-main";


            /* ---------- Name ---------- */

            const name =
                document.createElement("div");

            name.className = "item-name";

            name.textContent =
                contact.name || "PENCIL User";


            /* ---------- Online Dot ---------- */

            const dot =
                document.createElement("span");

            dot.className = "online-dot";

            dot.id =
                "dot-" + Utils.safeId(id);

            dot.title = "Offline";


            name.appendChild(dot);


            /* ---------- Preview ---------- */

            const preview =
                document.createElement("div");

            preview.className = "item-preview";

            preview.textContent = id;


            if (contact.state) {

                const state =
                    document.createElement("span");

                state.textContent =
                    " • " +
                    String(contact.state)
                        .toUpperCase();

                preview.appendChild(state);
            }


            /* ---------- Build ---------- */

            main.appendChild(name);
            main.appendChild(preview);

            item.appendChild(avatar);
            item.appendChild(main);


            /* ---------- Open Chat ---------- */

            item.addEventListener(
                "click",
                () => {

                    if (
                        typeof ChatManager !==
                        "undefined" &&
                        typeof ChatManager.openChat ===
                        "function"
                    ) {

                        ChatManager.openChat(id);

                    } else {

                        console.warn(
                            "ChatManager.openChat() not available."
                        );
                    }
                }
            );


            list.appendChild(item);
        });


        /* ---------------------------------------------
           SEARCH EMPTY
           --------------------------------------------- */

        if (visibleCount === 0) {

            list.innerHTML = `
                <div class="empty-contact">
                    <div class="empty-contact-icon">⌕</div>
                    <div class="empty-contact-title">
                        No results
                    </div>
                    <div class="empty-contact-text">
                        No contact matches your search.
                    </div>
                </div>
            `;
        }
    },


    /* =================================================
       UPDATE ONLINE STATUS
       ================================================= */

    setOnline(id, online = true) {

        if (!id) {
            return;
        }


        const dot =
            document.getElementById(
                "dot-" + Utils.safeId(id)
            );


        if (!dot) {
            return;
        }


        if (online) {

            dot.classList.add("online");
            dot.title = "Online";

        } else {

            dot.classList.remove("online");
            dot.title = "Offline";
        }
    },


    /* =================================================
       UPDATE CONTACT NAME
       ================================================= */

    updateContactName(id, name) {

        if (!id || !name) {
            return false;
        }


        const contact =
            StorageManager.getContact(id);


        if (!contact) {
            return false;
        }


        const cleanName =
            Utils.cleanName(name);


        if (!cleanName) {
            return false;
        }


        StorageManager.saveContact(
            id,
            cleanName,
            contact.state || "IN"
        );


        this.renderList();

        return true;
    },


    /* =================================================
       PROFILE UI
       ================================================= */

    updateProfileUI(user) {

        if (!user) {
            return;
        }


        const name =
            Utils.cleanName(
                user.name || "PENCIL User"
            );


        const initial =
            Utils.getInitials(name);


        const profileMini =
            document.getElementById(
                "profileMini"
            );

        const profileBig =
            document.getElementById(
                "profileBig"
            );

        const profileName =
            document.getElementById(
                "profileName"
            );

        const profileId =
            document.getElementById(
                "profileId"
            );

        const profileState =
            document.getElementById(
                "profileState"
            );


        if (profileMini) {
            profileMini.textContent = initial;
        }


        if (profileBig) {
            profileBig.textContent = initial;
        }


        if (profileName) {
            profileName.textContent = name;
        }


        if (profileId) {

            profileId.textContent =
                "ID: " + (user.id || "--");
        }


        if (profileState) {

            profileState.textContent =
                "State: " +
                (
                    user.state ||
                    "--"
                ).toUpperCase();
        }
    },


    /* =================================================
       REFRESH
       ================================================= */

    refresh() {

        this.renderList();

        const user =
            StorageManager.getUser();

        if (user) {
            this.updateProfileUI(user);
        }
    }

};
