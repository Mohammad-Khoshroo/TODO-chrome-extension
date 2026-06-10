magneticPen.addEventListener("dragstart", (e) => {
    currentDragType = "pen";
    draggedTaskInfo = null;
    draggedNoteId = null;

    e.dataTransfer.setData("text/plain", "pen");
    e.dataTransfer.effectAllowed = "move";
});
