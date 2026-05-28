import {
    setCurrentDragType,
    setDraggedTaskInfo,
    setDraggedNoteId
} from "../main/state.js";

const magneticPen = document.getElementById('pencil');

export function initPencil() {
    magneticPen.addEventListener("dragstart", (e) => {
        setCurrentDragType("pen");
        setDraggedTaskInfo(null);
        setDraggedNoteId(null);

        e.dataTransfer.setData("text/plain", "pen");
        e.dataTransfer.effectAllowed = "move";
    });
}
