let msnry;
let currentDragType = null;
let draggedTaskInfo = null;
let draggedNoteId = null;

const persianNumbers = [/0/g, /1/g, /2/g, /3/g, /4/g, /5/g, /6/g, /7/g, /8/g, /9/g];
const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];

function convertToPersian(str) {
    if (typeof str === 'string') {
        for (let i = 0; i < 10; i++) {
            str = str
                .replace(persianNumbers[i], String.fromCharCode(i + 1776))
                .replace(arabicNumbers[i], String.fromCharCode(i + 1776));
        }
    }
    return str;
}

document.querySelectorAll('.persian-text').forEach(el => {
    el.innerHTML = convertToPersian(el.innerHTML);
});

const toFarsiNumber = (n) => n.toString().replace(/\d/g, x => "۰۱۲۳۴۵۶۷۸۹"[x]);

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ----------------------
//  ENVIRONMENT DETECTION
// ----------------------
const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local;

function loadNotes(callback) {
    if (isExtension) {
        chrome.storage.local.get(["fridgeNotes"], (result) => {
            callback(result.fridgeNotes || []);
        });
    } else {
        const raw = localStorage.getItem("fridgeNotes");
        callback(raw ? JSON.parse(raw) : []);
    }
}

function saveNotes() {
    if (isExtension) {
        chrome.storage.local.set({ fridgeNotes: notes });
    } else {
        localStorage.setItem("fridgeNotes", JSON.stringify(notes));
    }
}


// ----------------------
//     MAIN VARIABLES
// ----------------------
const fridgeContainer = document.getElementById('container');
const addNoteBtn = document.getElementById('add-note-btn');
const trashBin = document.getElementById('trash-bin');
const magneticPen = document.getElementById('pencil');
const eraser = document.getElementById('eraser');
const trashIcon = document.getElementById("trash");

let notes = [];
let activeNoteIndex = null;

const DELETE_HOURS = 2;
const DELETE_THRESHOLD_MS = DELETE_HOURS * 60 * 60 * 1000;

const getRandomColorClass = () => `color-${Math.floor(Math.random() * 4)}`;


// ----------------------
//    LOADING & CLEANUP
// ----------------------
function cleanupOldScribbles() {
    let changed = false;
    const now = Date.now();

    notes.forEach(note => {
        const before = note.tasks.length;

        note.tasks = note.tasks.filter(task => {
            if (task.scribbled && task.scribbledAt) {
                return now - task.scribbledAt < DELETE_THRESHOLD_MS;
            }
            return true;
        });

        if (note.tasks.length !== before) changed = true;
    });

    if (changed) {
        saveNotes();
        renderAllNotes();
    }
}

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


// ----------------------
//       RENDERING
// ----------------------
function autoResizeTextareas() {
    document.querySelectorAll('.note-task-text, .note-title').forEach(t => {
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
    });
}

function renderAllNotes() {
    fridgeContainer.innerHTML = '';

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;

        if (!note.id) {
            note.id = 'note_' + Date.now() + '_' + Math.random();
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'note-wrapper';
        wrapper.draggable = true;

        wrapper.style.transform = `rotate(${(Math.random() * 6) - 3}deg)`;
        wrapper.style.marginTop = `${Math.random() * 15 + 40}px`;
        wrapper.style.marginLeft = `${(Math.random() * 10) - 5}px`;

        let taskOffset = 0;
        let pageIndex = 0;
        let currentSign = Math.random() > 0.5 ? 1 : -1;

        do {
            const tasksLimit = pageIndex === 0 ? 4 : 5;
            const pageTasks = note.tasks.slice(taskOffset, taskOffset + tasksLimit);

            const noteDiv = document.createElement('div');

            let rotationAngle;

            if (Math.random() < 0.05) {
                rotationAngle = 0;
            } else {
                const randomMagnitude = Math.random() * 2 + 1;
                rotationAngle = randomMagnitude * currentSign;
            }

            noteDiv.style.transform = `rotate(${rotationAngle}deg)`;

            if (rotationAngle !== 0) {
                currentSign *= -1;
            }

            noteDiv.className = `note-paper ${note.colorClass} ${activeNoteIndex === noteIndex ? 'active' : ''}`;
            noteDiv.dataset.noteIndex = noteIndex;

            let tasksHTML = pageTasks.map((task, tIndex) => {
                const absoluteIndex = taskOffset + tIndex;

                return `
                    <li class="note-task ${task.scribbled ? 'scribbled' : ''}" 
                        data-task-index="${absoluteIndex}" 
                        draggable="true">
                        
                        <input 
                            type="checkbox" 
                            class="task-checkbox" 
                            draggable="false"
                            ${task.checked ? "checked" : ""}>
                            
                        <textarea 
                            class="note-task-text" 
                            rows="1" 
                            draggable="false"
                            placeholder="task. . .">${escapeHTML(task.text)}</textarea>
                    </li>
                `;
            }).join('');

            let innerHTML = '';

            if (pageIndex === 0) {
                innerHTML += `<div class="tape"></div>`;
                innerHTML += `
                    <textarea 
                        class="note-title" 
                        rows="1" 
                        draggable="false"
                        placeholder="Note Title. . .">${escapeHTML(note.title)}</textarea>
                `;
            } else {
                innerHTML += `<div class="tape link-tape"></div>`;
                noteDiv.classList.add('chained-note');
            }

            innerHTML += `<ul class="task-list">${tasksHTML}</ul>`;
            noteDiv.innerHTML = innerHTML;

            wrapper.appendChild(noteDiv);

            taskOffset += pageTasks.length;
            pageIndex++;
        } while (taskOffset < note.tasks.length);

        fridgeContainer.appendChild(wrapper);
    });

    autoResizeTextareas();
    updateTrashIcon();

    setTimeout(() => {
        if (msnry) {
            msnry.destroy();
        }

        msnry = new Masonry(fridgeContainer, {
            itemSelector: '.note-wrapper',
            gutter: 20,
            fitWidth: true,
            transitionDuration: '0.2s'
        });
    }, 50);
}


// ----------------------
//          EVENTS
// ----------------------

addNoteBtn.addEventListener('click', () => {
    notes.push({
        id: 'note_' + Date.now(),
        title: '',
        colorClass: getRandomColorClass(),
        tasks: [{ text: '', checked: false, scribbled: false }]
    });

    activeNoteIndex = notes.length - 1;
    saveNotes();
    renderAllNotes();
});


// ذخیره عنوان و تسک‌ها
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


// انتخاب note فعال
document.addEventListener("mousedown", (e) => {
    const noteEl = e.target.closest(".note-paper");

    if (noteEl) {
        const newIndex = Number(noteEl.dataset.noteIndex);

        if (newIndex !== activeNoteIndex) {
            activeNoteIndex = newIndex;

            document.querySelectorAll('.note-paper').forEach(el => {
                el.classList.remove('active');
            });

            document.querySelectorAll(`.note-paper[data-note-index="${activeNoteIndex}"]`).forEach(el => {
                el.classList.add('active');
            });
        }

        return;
    }

    if (
        e.target.closest("#add-note-btn") ||
        e.target.closest("#trash-bin") ||
        e.target.closest("#pencil") ||
        e.target.closest("#eraser")
    ) {
        return;
    }

    if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
    ) {
        document.activeElement.blur();
    }

    if (activeNoteIndex !== null) {
        activeNoteIndex = null;
        renderAllNotes();
    }
});


// Ctrl + Enter برای اضافه کردن تسک
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "Enter" && activeNoteIndex != null) {
        notes[activeNoteIndex].tasks.push({
            text: "",
            checked: false,
            scribbled: false
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

magneticPen.addEventListener("dragstart", (e) => {
    currentDragType = "pen";
    draggedTaskInfo = null;
    draggedNoteId = null;

    e.dataTransfer.setData("text/plain", "pen");
    e.dataTransfer.effectAllowed = "move";
});

eraser.addEventListener("dragstart", (e) => {
    currentDragType = "eraser";
    draggedTaskInfo = null;
    draggedNoteId = null;

    e.dataTransfer.setData("text/plain", "eraser");
    e.dataTransfer.effectAllowed = "move";
});



fridgeContainer.addEventListener("dragstart", (e) => {
    if (
        e.target.closest(".note-task-text") ||
        e.target.closest(".note-title") ||
        e.target.closest(".task-checkbox")
    ) {
        e.preventDefault();
        return;
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

// ----------------------
//       TRASH BIN
// ----------------------
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


// Periodic cleanup
setInterval(cleanupOldScribbles, 5 * 60 * 1000);


// ----------------------
//     INITIAL LOAD
// ----------------------
loadNotes((loaded) => {
    notes = loaded;

    notes.forEach(note => {
        if (!note.id) {
            note.id = 'note_' + Date.now() + '_' + Math.random();
        }

        if (!Array.isArray(note.tasks)) {
            note.tasks = [];
        }
    });

    cleanupOldScribbles();
    cleanupTrash();
    renderAllNotes();
});


//////////////////////////////////////////////////////////////////
// ----------------------
//       CALENDAR
// ----------------------

const monthNames = [
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند"
];

let currentGregorianDate = new Date();
let todayJalali = jalaali.toJalaali(currentGregorianDate);

let currentJy = todayJalali.jy;
let currentJm = todayJalali.jm;

function renderCalendar(jy, jm) {
    const daysContainer = document.getElementById('daysContainer');
    const monthYearDisplay = document.getElementById('monthYear');

    daysContainer.innerHTML = '';
    monthYearDisplay.textContent = `${monthNames[jm - 1]} ${toFarsiNumber(jy)}`;

    const firstDayGregorian = jalaali.toGregorian(jy, jm, 1);
    const dateObj = new Date(
        firstDayGregorian.gy,
        firstDayGregorian.gm - 1,
        firstDayGregorian.gd
    );

    let firstDayOfWeek = dateObj.getDay() + 1;
    if (firstDayOfWeek === 7) firstDayOfWeek = 0;

    const monthLength = jalaali.jalaaliMonthLength(jy, jm);

    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        daysContainer.appendChild(emptyDiv);
    }

    for (let i = 1; i <= monthLength; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = toFarsiNumber(i);

        if ((firstDayOfWeek + i - 1) % 7 === 6) {
            dayDiv.classList.add('friday');
        }

        if (
            jy === todayJalali.jy &&
            jm === todayJalali.jm &&
            i === todayJalali.jd
        ) {
            dayDiv.classList.add('today');
        }

        daysContainer.appendChild(dayDiv);
    }
}

document.getElementById('prevBtn').addEventListener('click', () => {
    currentJm--;

    if (currentJm < 1) {
        currentJm = 12;
        currentJy--;
    }

    renderCalendar(currentJy, currentJm);
});

document.getElementById('nextBtn').addEventListener('click', () => {
    currentJm++;

    if (currentJm > 12) {
        currentJm = 1;
        currentJy++;
    }

    renderCalendar(currentJy, currentJm);
});


// ----------------------
//     CALENDAR TOGGLE
// ----------------------
const toggleBtn = document.getElementById('calendar-btn');
const calendar = document.getElementById('calendar');

function getSavedCalendarState() {
    return localStorage.getItem("calendarMinimized") === "true";
}

function saveCalendarState(isMinimized) {
    localStorage.setItem("calendarMinimized", String(isMinimized));

    if (isExtension) {
        chrome.storage.local.set({ calendarMinimized: isMinimized });
    }
}

function applyCalendarState(isMinimized) {
    calendar.classList.toggle('minimized', isMinimized);
    document.body.classList.toggle('calendar-closed', isMinimized);

    toggleBtn.innerText = isMinimized
        ? '+ نمایش تقویم'
        : '− بستن تقویم';
}

if (toggleBtn && calendar) {
    const savedMinimized = getSavedCalendarState();

    applyCalendarState(savedMinimized);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.remove('no-calendar-transition');
        });
    });

    toggleBtn.addEventListener('click', function () {
        const isMinimized = !calendar.classList.contains('minimized');

        applyCalendarState(isMinimized);
        saveCalendarState(isMinimized);
    });
}

renderCalendar(currentJy, currentJm);


// ----------------------
//     WINDOW CHECK
// ----------------------
function checkWindowMaximized() {
    if (window.outerWidth >= window.screen.availWidth * 0.99) {
        document.body.classList.add('is-maximized-window');
    } else {
        document.body.classList.remove('is-maximized-window');
    }
}

window.addEventListener('resize', checkWindowMaximized);
checkWindowMaximized();
