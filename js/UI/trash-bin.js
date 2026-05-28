import {
    notes,
    currentDragType,
    draggedNoteId
} from "../main/state.js";

import { saveNotes } from "../shared/storage.js";
import { renderAllNotes } from "../note/note.js";

const trashBin = document.getElementById('trash-bin');
const trashIcon = document.getElementById("trash");

export function updateTrashIcon() {
    const hasTrash = notes.some(n => n.deletedAt);

    trashIcon.src = hasTrash
        ? "images/waste.ico"
        : "images/trash-bin.ico";
}

export function initTrashBin() {
    trashBin.addEventListener("dragover", (e) => {
        if (currentDragType !== "note") return;

        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        trashBin.classList.add("drag-over");
    });

    trashBin.addEventListener("dragleave", () => {
        trashBin.classList.remove("drag-over");
    });

    trashBin.addEventListener("drop", (e) => {
        if (currentDragType !== "note") return;

        e.preventDefault();
        trashBin.classList.remove("drag-over");

        const note = notes.find(n => n.id === draggedNoteId);

        if (note) {
            note.deletedAt = Date.now();
            saveNotes();
            renderAllNotes();
            updateTrashIcon();
        }
    });
}
