import { notes, contextTaskInfo, setContextTaskInfo } from "../main/state.js";
import { saveNotes } from "../shared/storage.js";
import { renderAllNotes } from "../note/note.js";

const fridgeContainer = document.getElementById('container');
const taskContextMenu = document.getElementById("task-context-menu");

export function openTaskContextMenu(x, y, noteIndex, taskIndex) {
    if (!taskContextMenu) return;

    setContextTaskInfo({ noteIndex, taskIndex });

    taskContextMenu.classList.remove("hidden");
    taskContextMenu.style.left = `${x}px`;
    taskContextMenu.style.top = `${y}px`;

    const menuRect = taskContextMenu.getBoundingClientRect();

    if (menuRect.right > window.innerWidth) {
        taskContextMenu.style.left = `${window.innerWidth - menuRect.width - 8}px`;
    }

    if (menuRect.bottom > window.innerHeight) {
        taskContextMenu.style.top = `${window.innerHeight - menuRect.height - 8}px`;
    }
}

export function closeTaskContextMenu() {
    if (!taskContextMenu) return;

    taskContextMenu.classList.add("hidden");
    setContextTaskInfo(null);
}

export function initContextMenu() {
    fridgeContainer.addEventListener("contextmenu", (e) => {
        const taskEl = e.target.closest(".note-task");
        if (!taskEl) return;

        const notePaper = taskEl.closest(".note-paper");
        if (!notePaper) return;

        e.preventDefault();

        const noteIndex = Number(notePaper.dataset.noteIndex);
        const taskIndex = Number(taskEl.dataset.taskIndex);

        openTaskContextMenu(e.clientX, e.clientY, noteIndex, taskIndex);
    });

    taskContextMenu.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn || !contextTaskInfo) return;

        const { noteIndex, taskIndex } = contextTaskInfo;
        const action = btn.dataset.action;

        const note = notes[noteIndex];
        const task = note?.tasks?.[taskIndex];

        if (!task) {
            closeTaskContextMenu();
            return;
        }

        if (action === "edit") {
            closeTaskContextMenu();

            setTimeout(() => {
                const notePaper = document.querySelector(`.note-paper[data-note-index="${noteIndex}"]`);
                if (!notePaper) return;

                const taskEl = notePaper.querySelector(`.note-task[data-task-index="${taskIndex}"]`);
                const taskText = taskEl?.querySelector(".note-task-text");
                if (!taskText) return;

                taskText.removeAttribute("readonly");
                taskText.classList.remove("locked-task");
                taskText.classList.add("editing-task");
                taskText.focus();

                const len = taskText.value.length;
                taskText.setSelectionRange(len, len);
            }, 0);

            return;
        }

        if (action === "toggle-scribble") {
            task.scribbled = !task.scribbled;
            task.scribbledAt = task.scribbled ? Date.now() : null;

            saveNotes();
            renderAllNotes();
            closeTaskContextMenu();
            return;
        }

        if (action === "delete") {
            note.tasks.splice(taskIndex, 1);

            saveNotes();
            renderAllNotes();
            closeTaskContextMenu();
            return;
        }
    });

    document.addEventListener("click", (e) => {
        if (!taskContextMenu) return;
        if (taskContextMenu.classList.contains("hidden")) return;

        if (!e.target.closest("#task-context-menu")) {
            closeTaskContextMenu();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeTaskContextMenu();
        }
    });

    window.addEventListener("resize", closeTaskContextMenu);
    window.addEventListener("scroll", closeTaskContextMenu, true);
}
