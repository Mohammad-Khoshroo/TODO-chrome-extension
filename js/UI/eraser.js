import {
    setCurrentDragType,
    setDraggedTaskInfo,
    setDraggedNoteId
} from "../main/state.js";

const eraser = document.getElementById('eraser');

export function initEraser() {
    eraser.addEventListener("dragstart", (e) => {
        setCurrentDragType("eraser");
        setDraggedTaskInfo(null);
        setDraggedNoteId(null);

        e.dataTransfer.setData("text/plain", "eraser");
        e.dataTransfer.effectAllowed = "move";
    });
}
