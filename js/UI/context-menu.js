function openTaskContextMenu(x, y, noteIndex, taskIndex) {
    if (!taskContextMenu) return;

    contextTaskInfo = { noteIndex, taskIndex };

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

function closeTaskContextMenu() {
    if (!taskContextMenu) return;

    taskContextMenu.classList.add("hidden");
    contextTaskInfo = null;
}

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
            const notePapers = document.querySelectorAll(
                `.note-paper[data-note-index="${noteIndex}"]`
            );

            let taskEl = null;

            notePapers.forEach(notePaper => {
                const foundTask = notePaper.querySelector(
                    `.note-task[data-task-index="${taskIndex}"]`
                );

                if (foundTask) {
                    taskEl = foundTask;
                }
            });

            if (!taskEl) return;

            const taskText = taskEl.querySelector(".note-task-text");
            if (!taskText) return;

            taskText.removeAttribute("readonly");
            taskText.classList.remove("locked-task");
            taskText.classList.add("editing-task");

            taskText.focus();

            const len = taskText.value.length;
            taskText.setSelectionRange(len, len);

            taskText.style.height = "auto";
            taskText.style.height = taskText.scrollHeight + "px";
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
    
    if (action === "set-deadline") {
        closeTaskContextMenu();

        const currentKey = getTaskDeadlineKey(task);
        const currentText = currentKey || formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd);

        const input = prompt(
            "تاریخ ددلاین را به فرمت YYYY-MM-DD وارد کنید.\nمثال: 1403-12-29",
            currentText
        );

        if (input === null) return;

        const normalized = input.trim();
        const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

        if (!match) {
            alert("فرمت تاریخ درست نیست. مثال صحیح: 1403-12-29");
            return;
        }

        const jy = Number(match[1]);
        const jm = Number(match[2]);
        const jd = Number(match[3]);

        if (!jalaali.isValidJalaaliDate(jy, jm, jd)) {
            alert("تاریخ جلالی معتبر نیست.");
            return;
        }

        task.deadline = formatJalaliKey(jy, jm, jd);
        selectedDeadlineKey = task.deadline;

        saveNotes();
        renderAllNotes();

        if (currentJy !== jy || currentJm !== jm) {
            currentJy = jy;
            currentJm = jm;
        }

        renderCalendar(currentJy, currentJm);
        updateDeadlinePanel(selectedDeadlineKey);
        return;
    }

    if (action === "clear-deadline") {
        task.deadline = null;

        saveNotes();
        renderAllNotes();
        renderCalendar(currentJy, currentJm);
        updateDeadlinePanel(selectedDeadlineKey);
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
