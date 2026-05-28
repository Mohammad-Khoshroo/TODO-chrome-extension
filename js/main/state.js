export let msnry = null;
export let currentDragType = null;
export let draggedTaskInfo = null;
export let draggedNoteId = null;
export let noteLayouts = {};
export let notes = [];
export let activeNoteIndex = null;
export let contextTaskInfo = null;

export function setMsnry(value) {
    msnry = value;
}

export function setCurrentDragType(value) {
    currentDragType = value;
}

export function setDraggedTaskInfo(value) {
    draggedTaskInfo = value;
}

export function setDraggedNoteId(value) {
    draggedNoteId = value;
}

export function setNotes(value) {
    notes = value;
}

export function setActiveNoteIndex(value) {
    activeNoteIndex = value;
}

export function setContextTaskInfo(value) {
    contextTaskInfo = value;
}

export function setNoteLayout(noteId, layout) {
    noteLayouts[noteId] = layout;
}

export function replaceNoteLayouts(value) {
    noteLayouts = value;
}
