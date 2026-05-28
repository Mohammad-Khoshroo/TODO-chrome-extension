import { setNotes, notes, activeNoteIndex, setActiveNoteIndex } from "./state.js";
import { loadNotes, saveNotes } from "../shared/storage.js";
import { applyPersianTextConversion } from "../shared/utils.js";
import { addNewNote, cleanupOldScribbles, cleanupTrash, createRandomNoteLayout, renderAllNotes } from "../note/note.js";
import { initTaskEvents } from "../note/task.js";
import { initCalendar } from "../calendar/calendar.js";
import { initContextMenu } from "../UI/context-menu.js";
import { initEraser } from "../UI/eraser.js";
import { initPencil } from "../UI/pencil.js";
import { initTrashBin } from "../UI/trash-bin.js";
import { initWindowControls } from "../UI/window-controls.js";

const addNoteBtn = document.getElementById('add-note-btn');

export function initApp() {
    applyPersianTextConversion();

    initPencil();
    initEraser();
    initTrashBin();
    initContextMenu();
    initWindowControls();
    initTaskEvents();
    initCalendar();

    addNoteBtn.addEventListener('click', () => {
        const newIndex = addNewNote();
        setActiveNoteIndex(newIndex);
        renderAllNotes();
    });

    document.addEventListener("keydown", e => {
        if (e.ctrlKey && e.key === "Enter" && activeNoteIndex != null) {
            notes[activeNoteIndex].tasks.push({
                text: "",
                checked: false,
                scribbled: false
            });

            saveNotes();
            renderAllNotes();

            setTimeout(() => {
                const inputs = document.querySelectorAll(
                    `.note-paper[data-note-index="${activeNoteIndex}"] .note-task-text`
                );

                if (inputs.length > 0) {
                    inputs[inputs.length - 1].focus();
                }
            }, 30);
        }
    });

    loadNotes((loaded) => {
        setNotes(loaded);
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

    setInterval(cleanupOldScribbles, 5 * 60 * 1000);
}
