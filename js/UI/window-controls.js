import {
    notes,
    activeNoteIndex,
    setActiveNoteIndex,
    setCurrentDragType,
    setDraggedTaskInfo,
    setDraggedNoteId
} from "../main/state.js";

import { saveNotes } from "../shared/storage.js";
import { renderAllNotes } from "../note/note.js";

const fridgeContainer = document.getElementById('container');

export function initWindowControls() {
    document.addEventListener("mousedown", (e) => {
        const noteEl = e.target.closest(".note-paper");

        if (noteEl) {
            const newIndex = Number(noteEl.dataset.noteIndex);

            if (newIndex !== activeNoteIndex) {
                setActiveNoteIndex(newIndex);

                document.querySelectorAll('.note-paper').forEach(el => {
                    el.classList.remove('active');
                });

                document.querySelectorAll(`.note-paper[data-note-index="${newIndex}"]`).forEach(el => {
                    el.classList.add('active');
                });
            }

            return;
        }

        if (
            e.target.closest("#add-note-btn") ||
            e.target.closest("#trash-bin") ||
            e.target.closest("#pencil") ||
            e.target.closest("#eraser")
        ) {
            return;
        }

        if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
        ) {
            document.activeElement.blur();
        }

        if (activeNoteIndex !== null) {
            setActiveNoteIndex(null);
            renderAllNotes();
        }
    });

    fridgeContainer.addEventListener("dragstart", (e) => {
        const wrapper = e.target.closest(".note-wrapper");
        const task = e.target.closest(".note-task");

        if (!wrapper || task) return;

        const notePaper = wrapper.querySelector(".note-paper");
        if (!notePaper) return;

        const noteIndex = Number(notePaper.dataset.noteIndex);
        const note = notes[noteIndex];
        if (!note) return;

        if (!note.id) {
            note.id = 'note_' + Date.now() + '_' + Math.random();
            saveNotes();
        }

        setCurrentDragType("note");
        setDraggedTaskInfo(null);
        setDraggedNoteId(note.id);

        e.dataTransfer.setData("text/plain", "note");
        e.dataTransfer.effectAllowed = "move";

        wrapper.classList.add("dragging-note");
    });

    document.addEventListener("dragend", () => {
        document.querySelectorAll(".dragging-task").forEach(el => {
            el.classList.remove("dragging-task");
        });

        document.querySelectorAll(".dragging-note").forEach(el => {
            el.classList.remove("dragging-note");
        });

        document.querySelectorAll(".note-task.drag-over").forEach(el => {
            el.classList.remove("drag-over");
        });

        const trashBin = document.getElementById("trash-bin");
        trashBin.classList.remove("drag-over");

        setCurrentDragType(null);
        setDraggedTaskInfo(null);
        setDraggedNoteId(null);
    });

    window.addEventListener('resize', checkWindowMaximized);
    checkWindowMaximized();
}

export function checkWindowMaximized() {
    if (window.outerWidth >= window.screen.availWidth * 0.99) {
        document.body.classList.add('is-maximized-window');
    } else {
        document.body.classList.remove('is-maximized-window');
    }
}
