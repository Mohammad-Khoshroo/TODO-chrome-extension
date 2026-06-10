let msnry;
let currentDragType = null;
let draggedTaskInfo = null;
let draggedNoteId = null;
let noteLayouts = {};
const taskContextMenu = document.getElementById("task-context-menu");
let contextTaskInfo = null;

function formatJalaliKey(jy, jm, jd) {
    const mm = String(jm).padStart(2, "0");
    const dd = String(jd).padStart(2, "0");
    return `${jy}-${mm}-${dd}`;
}

const persianNumbers = [/0/g, /1/g, /2/g, /3/g, /4/g, /5/g, /6/g, /7/g, /8/g, /9/g];
const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];

function convertToPersian(str) {
    if (typeof str === 'string') {
        for (let i = 0; i < 10; i++) {
            str = str
                .replace(persianNumbers[i], String.fromCharCode(i + 1776))
                .replace(arabicNumbers[i], String.fromCharCode(i + 1776));
        }
    }
    return str;
}

document.querySelectorAll('.persian-text').forEach(el => {
    el.innerHTML = convertToPersian(el.innerHTML);
});

const toFarsiNumber = (n) => n.toString().replace(/\d/g, x => "۰۱۲۳۴۵۶۷۸۹"[x]);

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ----------------------
//  ENVIRONMENT DETECTION
// ----------------------
const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local;

function loadNotes(callback) {
    if (isExtension) {
        chrome.storage.local.get(["fridgeNotes"], (result) => {
            callback(result.fridgeNotes || []);
        });
    } else {
        const raw = localStorage.getItem("fridgeNotes");
        callback(raw ? JSON.parse(raw) : []);
    }
}

function saveNotes() {
    if (isExtension) {
        chrome.storage.local.set({ fridgeNotes: notes });
    } else {
        localStorage.setItem("fridgeNotes", JSON.stringify(notes));
    }
}

// ----------------------
//     MAIN VARIABLES
// ----------------------
const fridgeContainer = document.getElementById('container');
const addNoteBtn = document.getElementById('add-note-btn');
const trashBin = document.getElementById('trash-bin');
const magneticPen = document.getElementById('pen');
const eraser = document.getElementById('eraser');
const trashIcon = document.getElementById("trash");

let notes = [];
let activeNoteIndex = null;

const DELETE_HOURS = 2;
const DELETE_THRESHOLD_MS = DELETE_HOURS * 60 * 60 * 1000;

const getRandomColorClass = () => `color-${Math.floor(Math.random() * 4)}`;

function cleanupOldScribbles() {
    let changed = false;
    const now = Date.now();

    notes.forEach(note => {
        const before = note.tasks.length;

        note.tasks = note.tasks.filter(task => {
            if (task.scribbled && task.scribbledAt) {
                return now - task.scribbledAt < DELETE_THRESHOLD_MS;
            }
            return true;
        });

        if (note.tasks.length !== before) changed = true;
    });

    if (changed) {
        saveNotes();
        renderAllNotes();
    }
}

// Periodic cleanup
setInterval(cleanupOldScribbles, 5 * 60 * 1000);

// ----------------------
//     INITIAL LOAD
// ----------------------
loadNotes((loaded) => {
    notes = loaded;
    let changed = false;

    notes.forEach(note => {
        if (!note.id) {
            note.id = 'note_' + Date.now() + '_' + Math.random();
            changed = true;
        }

        if (!Array.isArray(note.tasks)) {
            note.tasks = [];
            changed = true;
        }

        note.tasks.forEach(task => {
            if (!("deadline" in task)) {
                task.deadline = null;
                changed = true;
            }
        });
        if (!note.layout) {
            note.layout = createRandomNoteLayout(note);
            changed = true;
        }
    });

    if (changed) saveNotes();

    cleanupOldScribbles();
    cleanupTrash();
    renderAllNotes();
});
