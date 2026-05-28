import {
    notes,
    currentDragType,
    draggedTaskInfo,
    setCurrentDragType,
    setDraggedTaskInfo,
    setDraggedNoteId
} from "../main/state.js";

import { saveNotes } from "../shared/storage.js";
import { renderAllNotes } from "./note.js";

const fridgeContainer = document.getElementById('container');

export function initTaskEvents() {
    fridgeContainer.addEventListener('input', (e) => {
        const noteEl = e.target.closest('.note-paper');
        if (!noteEl) return;

        const noteIndex = Number(noteEl.dataset.noteIndex);

        if (e.target.classList.contains('note-title')) {
            notes[noteIndex].title = e.target.value;
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            saveNotes();
        }

        if (e.target.classList.contains('note-task-text')) {
            const taskEl = e.target.closest('.note-task');
            if (!taskEl) return;

            const taskIndex = Number(taskEl.dataset.taskIndex);
            notes[noteIndex].tasks[taskIndex].text = e.target.value;

            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';

            saveNotes();
        }
    });

    fridgeContainer.addEventListener('change', (e) => {
        const noteEl = e.target.closest('.note-paper');
        if (!noteEl) return;

        const noteIndex = Number(noteEl.dataset.noteIndex);

        if (e.target.classList.contains('task-checkbox')) {
            const taskEl = e.target.closest('.note-task');
            if (!taskEl) return;

            const taskIndex = Number(taskEl.dataset.taskIndex);
            notes[noteIndex].tasks[taskIndex].checked = e.target.checked;
            saveNotes();
        }
    });

    fridgeContainer.addEventListener("blur", (e) => {
        if (!e.target.classList.contains("note-task-text")) return;

        const taskText = e.target;

        if (taskText.value.trim()) {
            taskText.setAttribute("readonly", "readonly");
            taskText.classList.add("locked-task");
            taskText.classList.remove("editing-task");
        }
    }, true);

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
        if (!taskEl) return;

        const notePaper = taskEl.closest(".note-paper");
        if (!notePaper) return;

        const noteIndex = Number(notePaper.dataset.noteIndex);
        const taskIndex = Number(taskEl.dataset.taskIndex);

        setCurrentDragType("task");
        setDraggedTaskInfo({ noteIndex, taskIndex });
        setDraggedNoteId(null);

        e.dataTransfer.setData("text/plain", "task");
        e.dataTransfer.effectAllowed = "move";

        taskEl.classList.add("dragging-task");
    });

    fridgeContainer.addEventListener("dragover", (e) => {
        const taskItem = e.target.closest(".note-task");
        if (!taskItem) return;

        if (!["task", "pen", "eraser"].includes(currentDragType)) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        document.querySelectorAll(".note-task.drag-over").forEach(el => {
            if (el !== taskItem) {
                el.classList.remove("drag-over");
            }
        });

        taskItem.classList.add("drag-over");
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
        const targetTaskIndex = Number(targetTaskEl.dataset.task-index || targetTaskEl.dataset.taskIndex);

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
}
