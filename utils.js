/* =====================================================
   PENCIL
   Utility Functions
   File: utils.js
   ===================================================== */

const Utils = {

    /* =================================================
       TIME
       ================================================= */

    formatTime(time) {
        const date = new Date(time);

        if (Number.isNaN(date.getTime())) {
            return "--:--";
        }

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    },


    formatDateTime(time) {
        const date = new Date(time);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return date.toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short"
        });
    },


    /* =================================================
       ID HELPERS
       ================================================= */

    safeId(value) {
        return String(value ?? "")
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 100);
    },


    isValidPencilId(id) {
        if (!id) return false;

        return /^IN-[A-Z]{2}-[A-Z0-9]+$/i.test(
            String(id).trim()
        );
    },


    /* =================================================
       TEXT / HTML SECURITY
       ================================================= */

    escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },


    /* =================================================
       TEXT CLEANING
       ================================================= */

    cleanText(value, maxLength = 5000) {

        return String(value ?? "")
            .replace(/\u0000/g, "")
            .trim()
            .slice(0, maxLength);
    },


    cleanName(value, maxLength = 50) {

        return String(value ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, maxLength);
    },


    cleanState(value) {

        return String(value ?? "")
            .replace(/[^a-zA-Z]/g, "")
            .toUpperCase()
            .slice(0, 2);
    },


    /* =================================================
       AVATAR
       ================================================= */

    getInitials(name) {

        const cleanName = this.cleanName(name);

        if (!cleanName) {
            return "?";
        }

        const words = cleanName.split(" ");

        if (words.length === 1) {
            return words[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    },


    /* =================================================
       RANDOM ID / TOKEN
       ================================================= */

    randomString(length = 8) {

        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        let result = "";

        if (
            window.crypto &&
            window.crypto.getRandomValues
        ) {

            const array =
                new Uint32Array(length);

            window.crypto.getRandomValues(array);

            for (let i = 0; i < length; i++) {
                result += chars[
                    array[i] % chars.length
                ];
            }

        } else {

            for (let i = 0; i < length; i++) {
                result += chars[
                    Math.floor(
                        Math.random() * chars.length
                    )
                ];
            }
        }

        return result;
    },


    /* =================================================
       FILE HELPERS
       ================================================= */

    formatFileSize(bytes) {

        const size = Number(bytes);

        if (!Number.isFinite(size) || size < 0) {
            return "0 B";
        }

        if (size < 1024) {
            return `${size} B`;
        }

        if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        }

        if (size < 1024 * 1024 * 1024) {
            return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        }

        return `${(
            size /
            (1024 * 1024 * 1024)
        ).toFixed(1)} GB`;
    },


    isImage(file) {

        return !!(
            file &&
            file.type &&
            file.type.startsWith("image/")
        );
    },


    isVideo(file) {

        return !!(
            file &&
            file.type &&
            file.type.startsWith("video/")
        );
    },


    isAudio(file) {

        return !!(
            file &&
            file.type &&
            file.type.startsWith("audio/")
        );
    },


    /* =================================================
       TIME / DATE
       ================================================= */

    isToday(time) {

        const date = new Date(time);
        const today = new Date();

        return (
            date.toDateString() ===
            today.toDateString()
        );
    },


    /* =================================================
       COPY TO CLIPBOARD
       ================================================= */

    async copyText(text) {

        try {

            await navigator.clipboard.writeText(
                String(text ?? "")
            );

            return true;

        } catch (error) {

            console.error(
                "Clipboard error:",
                error
            );

            return false;
        }
    },


    /* =================================================
       DEBOUNCE
       ================================================= */

    debounce(callback, delay = 300) {

        let timer;

        return function (...args) {

            clearTimeout(timer);

            timer = setTimeout(() => {
                callback.apply(this, args);
            }, delay);
        };
    },


    /* =================================================
       DOM SHORTCUTS
       ================================================= */

    $(selector) {

        return document.querySelector(selector);
    },


    $$(selector) {

        return document.querySelectorAll(selector);
    },


    /* =================================================
       SAFE JSON
       ================================================= */

    parseJSON(value, fallback = null) {

        try {

            return JSON.parse(value);

        } catch (error) {

            return fallback;
        }
    },


    /* =================================================
       DEVICE
       ================================================= */

    isMobile() {

        return window.matchMedia(
            "(max-width: 750px)"
        ).matches;
    },


    /* =================================================
       SMALL DELAY
       ================================================= */

    sleep(ms) {

        return new Promise(resolve =>
            setTimeout(resolve, ms)
        );
    }

};
