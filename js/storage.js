/**
 * Provides a secure storage interface using the Web Crypto API (SubtleCrypto).
 * Data is encrypted with AES-GCM. The encryption key is stored in IndexedDB.
 */

const KEY_PREFIX = 'pwa_sheets_';
const DB_NAME = 'pwa-sheets-crypto';
const DB_VERSION = 1;
const KEY_STORE_NAME = 'crypto_keys';
const KEY_NAME = 'storage_key';

let dbPromise = null;
function getDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore(KEY_STORE_NAME);
            };
        });
    }
    return dbPromise;
}

async function getCryptoKey() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(KEY_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(KEY_STORE_NAME);
        const request = store.get(KEY_NAME);
        request.onsuccess = async () => {
            if (request.result) {
                resolve(request.result);
            } else {
                // Key not found, generate a new one
                const newKey = await window.crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true, // exportable
                    ['encrypt', 'decrypt']
                );
                store.put(newKey, KEY_NAME);
                resolve(newKey);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Base64 helpers
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export const secureStorage = {
    async setItem(key, value) {
        try {
            const cryptoKey = await getCryptoKey();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const plainText = JSON.stringify(value);
            const encodedText = new TextEncoder().encode(plainText);

            const encryptedData = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                cryptoKey,
                encodedText
            );

            const storedObject = {
                iv: arrayBufferToBase64(iv),
                data: arrayBufferToBase64(encryptedData)
            };

            localStorage.setItem(KEY_PREFIX + key, JSON.stringify(storedObject));
        } catch (e) {
            console.error("Failed to save to secure storage", e);
        }
    },

    async getItem(key) {
        try {
            const storedValue = localStorage.getItem(KEY_PREFIX + key);
            if (storedValue === null) {
                return null;
            }

            const storedObject = JSON.parse(storedValue);
            const iv = base64ToArrayBuffer(storedObject.iv);
            const encryptedData = base64ToArrayBuffer(storedObject.data);
            const cryptoKey = await getCryptoKey();

            const decryptedData = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                cryptoKey,
                encryptedData
            );

            const decodedText = new TextDecoder().decode(decryptedData);
            return JSON.parse(decodedText);
        } catch (e) {
            console.error("Failed to retrieve from secure storage", e);
            // If decryption fails, it could be due to a key change or corrupt data.
            // For safety, remove the potentially corrupt item.
            this.removeItem(key);
            return null;
        }
    },

    removeItem(key) {
        localStorage.removeItem(KEY_PREFIX + key);
    }
};
