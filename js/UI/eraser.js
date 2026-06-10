eraser.addEventListener("dragstart", (e) => {
    currentDragType = "eraser";
    draggedTaskInfo = null;
    draggedNoteId = null;

    e.dataTransfer.setData("text/plain", "eraser");
    e.dataTransfer.effectAllowed = "move";
});
