import { notes } from "../main/state.js";

export const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local;

export function loadNotes(callback) {
    if (isExtension) {
        chrome.storage.local.get(["fridgeNotes"], (result) => {
            callback(result.fridgeNotes || []);
        });
    } else {
        const raw = localStorage.getItem("fridgeNotes");
        callback(raw ? JSON.parse(raw) : []);
    }
}

export function saveNotes() {
    if (isExtension) {
        chrome.storage.local.set({ fridgeNotes: notes });
    } else {
        localStorage.setItem("fridgeNotes", JSON.stringify(notes));
    }
}

export function getSavedCalendarState() {
    return localStorage.getItem("calendarMinimized") === "true";
}

export function saveCalendarState(isMinimized) {
    localStorage.setItem("calendarMinimized", String(isMinimized));

    if (isExtension) {
        chrome.storage.local.set({ calendarMinimized: isMinimized });
    }
}
