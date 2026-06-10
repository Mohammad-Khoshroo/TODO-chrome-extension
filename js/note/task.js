fridgeContainer.addEventListener("blur", (e) => {
    if (!e.target.classList.contains("note-task-text")) return;

    const taskText = e.target;

    if (taskText.value.trim()) {
        taskText.setAttribute("readonly", "readonly");
        taskText.classList.add("locked-task");
        taskText.classList.remove("editing-task");
    }
}, true);

// Ctrl + Enter برای اضافه کردن تسک
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "Enter" && activeNoteIndex != null) {
        notes[activeNoteIndex].tasks.push({
            text: "",
            checked: false,
            scribbled: false,
            deadline: null
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

// ----------------------
//     DRAG & DROP CLEAN
// ----------------------
fridgeContainer.addEventListener("dragstart", (e) => {
    const taskText = e.target.closest(".note-task-text");
    const noteTitle = e.target.closest(".note-title");
    const checkbox = e.target.closest(".task-checkbox");

    if (noteTitle || checkbox) {
        e.preventDefault();
        return;
    }

    if (taskText) {
        const isLocked =
            taskText.classList.contains("locked-task") ||
            taskText.hasAttribute("readonly");

        if (!isLocked) {
            e.preventDefault();
            return;
        }
    }

    const taskEl = e.target.closest(".note-task");

    if (taskEl) {
        const notePaper = taskEl.closest(".note-paper");
        if (!notePaper) return;

        const noteIndex = Number(notePaper.dataset.noteIndex);
        const taskIndex = Number(taskEl.dataset.taskIndex);

        currentDragType = "task";
        draggedTaskInfo = { noteIndex, taskIndex };
        draggedNoteId = null;

        e.dataTransfer.setData("text/plain", "task");
        e.dataTransfer.effectAllowed = "move";

        taskEl.classList.add("dragging-task");
        return;
    }

    const wrapper = e.target.closest(".note-wrapper");

    if (wrapper) {
        const notePaper = wrapper.querySelector(".note-paper");
        if (!notePaper) return;

        const noteIndex = Number(notePaper.dataset.noteIndex);
        const note = notes[noteIndex];
        if (!note) return;

        if (!note.id) {
            note.id = 'note_' + Date.now() + '_' + Math.random();
            saveNotes();
        }

        currentDragType = "note";
        draggedTaskInfo = null;
        draggedNoteId = note.id;

        e.dataTransfer.setData("text/plain", "note");
        e.dataTransfer.effectAllowed = "move";

        wrapper.classList.add("dragging-note");
    }
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

    trashBin.classList.remove("drag-over");

    currentDragType = null;
    draggedTaskInfo = null;
    draggedNoteId = null;
});

fridgeContainer.addEventListener("dragover", (e) => {
    // ۱. اگر درگ مربوط به ما نیست کلاً خارج شو
    if (!["task", "pen", "eraser"].includes(currentDragType)) return;

    // ۲. حذف علامت ممنوع برای این ابزارها در کل محدوده یخچال
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // ۳. پیدا کردن تسک زیر موس
    const taskItem = e.target.closest(".note-task");

    // ۴. مدیریت کلاس‌های بصری (هاور شدن)
    document.querySelectorAll(".note-task.drag-over").forEach(el => {
        if (el !== taskItem) {
            el.classList.remove("drag-over");
        }
    });

    if (taskItem) {
        taskItem.classList.add("drag-over");
    }
});

fridgeContainer.addEventListener("dragleave", (e) => {
    const taskItem = e.target.closest(".note-task");
    if (!taskItem) return;

    const related = e.relatedTarget;

    if (related && taskItem.contains(related)) {
        return;
    }

    taskItem.classList.remove("drag-over");
});

fridgeContainer.addEventListener("drop", (e) => {
    const targetTaskEl = e.target.closest(".note-task");
    if (!targetTaskEl) return;

    if (!["task", "pen", "eraser"].includes(currentDragType)) return;

    e.preventDefault();
    e.stopPropagation();

    document.querySelectorAll(".note-task.drag-over").forEach(el => {
        el.classList.remove("drag-over");
    });

    const targetNotePaper = targetTaskEl.closest(".note-paper");
    if (!targetNotePaper) return;

    const targetNoteIndex = Number(targetNotePaper.dataset.noteIndex);
    const targetTaskIndex = Number(targetTaskEl.dataset.taskIndex);

    if (currentDragType === "task") {
        if (!draggedTaskInfo) return;

        const sourceNoteIndex = draggedTaskInfo.noteIndex;
        const sourceTaskIndex = draggedTaskInfo.taskIndex;

        if (
            Number.isNaN(sourceNoteIndex) ||
            Number.isNaN(sourceTaskIndex) ||
            Number.isNaN(targetNoteIndex) ||
            Number.isNaN(targetTaskIndex)
        ) {
            return;
        }

        if (sourceNoteIndex === targetNoteIndex && sourceTaskIndex === targetTaskIndex) {
            return;
        }

        const sourceTasks = notes[sourceNoteIndex]?.tasks;
        const targetTasks = notes[targetNoteIndex]?.tasks;

        if (!sourceTasks || !targetTasks) return;

        const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);
        if (!movedTask) return;

        let insertIndex = targetTaskIndex;

        if (sourceNoteIndex === targetNoteIndex && sourceTaskIndex < targetTaskIndex) {
            insertIndex--;
        }

        targetTasks.splice(insertIndex, 0, movedTask);

        saveNotes();
        renderAllNotes();
        return;
    }

    if (currentDragType === "pen") {
        const task = notes[targetNoteIndex]?.tasks?.[targetTaskIndex];
        if (!task) return;

        task.scribbled = !task.scribbled;
        task.scribbledAt = task.scribbled ? Date.now() : null;

        saveNotes();
        renderAllNotes();
        return;
    }

    if (currentDragType === "eraser") {
        if (!notes[targetNoteIndex]?.tasks) return;

        notes[targetNoteIndex].tasks.splice(targetTaskIndex, 1);

        saveNotes();
        renderAllNotes();
    }
});
