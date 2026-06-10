// ----------------------
//       TRASH BIN
// ----------------------
function cleanupTrash() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    notes = notes.filter(n => !n.deletedAt || now - n.deletedAt < ONE_DAY);

    saveNotes();
    updateTrashIcon();
}

function updateTrashIcon() {
    const hasTrash = notes.some(n => n.deletedAt);

    if (hasTrash) {
        trashIcon.src = "images/waste.ico";
    } else {
        trashIcon.src = "images/trash-bin.ico";
    }
}

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
