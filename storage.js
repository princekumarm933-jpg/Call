// ============================================
// PENCIL — Storage Manager
// File: storage.js
// ============================================

const StorageManager = {

    // --------------------------------------------
    // USER / PERMANENT DEVICE IDENTITY
    // --------------------------------------------

    getUser() {
        const saved = localStorage.getItem("permanent_device_identity");

        if (!saved) {
            return null;
        }

        try {
            return JSON.parse(saved);
        } catch (error) {
            console.error("User data read error:", error);
            return null;
        }
    },


    hasUser() {
        return !!localStorage.getItem("permanent_device_identity");
    },


    // Name change hoga, ID kabhi change nahi hoga
    updateUser(name, state = null) {

        const user = this.getUser();

        if (!user || !name || !name.trim()) {
            return false;
        }

        const updatedUser = {
            id: user.id,                         // Permanent ID
            name: name.trim(),                   // Editable name
            state: (state || user.state || "IN").toUpperCase(),

            createdAt: user.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        localStorage.setItem(
            "permanent_device_identity",
            JSON.stringify(updatedUser)
        );

        return true;
    },


    // --------------------------------------------
    // CONTACTS
    // --------------------------------------------

    getContacts() {

        try {
            return JSON.parse(
                localStorage.getItem("pencil_contacts") || "{}"
            );
        } catch (error) {
            console.error("Contacts read error:", error);
            return {};
        }
    },


    saveContact(id, name = null, state = null) {

        if (!id) {
            return false;
        }

        const contacts = this.getContacts();
        const user = this.getUser();

        // Apne aap ko contact nahi bana sakte
        if (user && user.id === id) {
            return false;
        }

        if (!contacts[id]) {

            contacts[id] = {
                id: id,
                name: name || "PENCIL User",
                state: state || "IN",
                timestamp: Date.now()
            };

        } else {

            // Agar new name/state mila hai
            if (name) {
                contacts[id].name = name;
            }

            if (state) {
                contacts[id].state = state;
            }
        }

        localStorage.setItem(
            "pencil_contacts",
            JSON.stringify(contacts)
        );

        return true;
    },


    getContact(id) {

        const contacts = this.getContacts();

        return contacts[id] || null;
    },


    deleteContact(id) {

        const contacts = this.getContacts();

        if (!contacts[id]) {
            return false;
        }

        delete contacts[id];

        localStorage.setItem(
            "pencil_contacts",
            JSON.stringify(contacts)
        );

        return true;
    },


    // --------------------------------------------
    // CHAT MESSAGE STORAGE
    // --------------------------------------------

    saveMessage(id, type, content, direction) {

        if (!id) {
            return false;
        }

        const key = "pencil_chat_" + id;

        let history = [];

        try {
            history = JSON.parse(
                localStorage.getItem(key) || "[]"
            );
        } catch (error) {
            history = [];
        }

        history.push({

            type: type,

            content: content,

            direction: direction,

            time: Date.now()

        });

        localStorage.setItem(
            key,
            JSON.stringify(history)
        );

        return true;
    },


    getChatHistory(id) {

        if (!id) {
            return [];
        }

        try {

            return JSON.parse(
                localStorage.getItem(
                    "pencil_chat_" + id
                ) || "[]"
            );

        } catch (error) {

            return [];
        }
    },


    clearChat(id) {

        if (!id) {
            return false;
        }

        localStorage.removeItem(
            "pencil_chat_" + id
        );

        return true;
    },


    // --------------------------------------------
    // DELETE ALL LOCAL PENCIL DATA
    // --------------------------------------------

    clearAllData() {

        localStorage.removeItem(
            "permanent_device_identity"
        );

        localStorage.removeItem(
            "pencil_contacts"
        );

        // PENCIL chat history
        Object.keys(localStorage).forEach(key => {

            if (key.startsWith("pencil_chat_")) {
                localStorage.removeItem(key);
            }

        });

        return true;
    }

};
