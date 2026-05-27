const persianNumbers = [/O/g, /1/g, /2/g, /3/g, /4/g, /5/g, /6/g, /7/g, /8/g, /9/g];
const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];

function convertToPersian(str) {
  if(typeof str === 'string') {
    for(let i=0; i<10; i++) {
      str = str.replace(persianNumbers[i], String.fromCharCode(i+1776)).replace(arabicNumbers[i], String.fromCharCode(i+1776));
    }
  }
  return str;
}

// اعمال روی تمام تگ هایی که کلاس persian-text دارند
document.querySelectorAll('.persian-text').forEach(el => {
  el.innerHTML = convertToPersian(el.innerHTML);
});

const toFarsiNumber = (n) => n.toString().replace(/\d/g, x => "۰۱۲۳۴۵۶۷۸۹"[x]);

// ----------------------
//  ENVIRONMENT DETECTION
// ----------------------
const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local;

// Wrapper functions for storage
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
const fridgeContainer = document.getElementById('fridge-container');
const addNoteBtn = document.getElementById('add-note-btn');
const trashBin = document.getElementById('trash-bin');
const magneticPen = document.getElementById('pencil');
const eraser = document.getElementById('eraser');

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

const trashIcon = document.getElementById("trash");

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
    document.querySelectorAll('.task-input, .note-title').forEach(t => {
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
    });
}

function renderAllNotes() {
    fridgeContainer.innerHTML = '';

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;

        // Create a main wrapper for notes so they remain grouped together
        const wrapper = document.createElement('div');
        wrapper.className = 'note-wrapper';
        wrapper.setAttribute('draggable', 'true');

        // Apply random rotation and margins to the entire group
        wrapper.style.transform = `rotate(${(Math.random() * 6) - 3}deg)`;
        wrapper.style.marginTop = `${Math.random() * 15 + 40}px`;
        wrapper.style.marginLeft = `${(Math.random() * 10) - 5}px`;

        wrapper.addEventListener("dragstart", (e) => {
            if (!note.id) note.id = 'note_' + Date.now() + Math.random();
            e.dataTransfer.setData("noteId", note.id);
        });

        let taskOffset = 0;
        let pageIndex = 0;

        let currentSign = Math.random() > 0.5 ? 1 : -1;

        // Split tasks into different pages
        do {
            const tasksLimit = pageIndex === 0 ? 4 : 5;
            const pageTasks = note.tasks.slice(taskOffset, taskOffset + tasksLimit);

            const noteDiv = document.createElement('div');
            let rotationAngle;

            // 5% chance for the angle to be exactly zero
            if (Math.random() < 0.05) {
                rotationAngle = 0;
            } else {
                // Generate a random angle between 1 and 3 degrees
                let randomMagnitude = Math.random() * 2 + 1;

                // Apply sign (positive or negative) to the angle
                rotationAngle = randomMagnitude * currentSign;
            }

            // Apply rotation to the page
            noteDiv.style.transform = `rotate(${rotationAngle}deg)`;

            // Reverse the sign for the next page
            if (rotationAngle !== 0) {
                currentSign *= -1;
            }

            noteDiv.className = `sticky-note ${note.colorClass} ${activeNoteIndex === noteIndex ? 'active' : ''}`;
            noteDiv.dataset.noteIndex = noteIndex;

            // Build tasks HTML with absolute index
            let tasksHTML = pageTasks.map((task, tIndex) => {
                const absoluteIndex = taskOffset + tIndex;
                return `
                <li class="task-item ${task.scribbled ? 'scribbled' : ''}" data-task-index="${absoluteIndex}">
                    <input height="40px" type="checkbox" class="task-checkbox" ${task.checked ? "checked" : ""}>
                    <textarea class="task-input" rows="1" placeholder="task. . .">${task.text}</textarea>
                </li>
            `}).join('');

            let innerHTML = '';

            if (pageIndex === 0) {
                innerHTML += `<div class="tape"></div>`;
                innerHTML += `<input type="text" class="note-title" value="${note.title}" placeholder="Note Title. . .">`;
            } else {
                // Tape to connect subsequent pages to the previous one
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

fridgeContainer.addEventListener('change', (e) => {
    const noteEl = e.target.closest('.sticky-note');
    if (!noteEl) return;

    const noteIndex = +noteEl.dataset.noteIndex;

    if (e.target.classList.contains('note-title')) {
        notes[noteIndex].title = e.target.value;
    }

    if (e.target.classList.contains('task-input')) {
        const taskIndex = +e.target.closest('.task-item').dataset.taskIndex;
        notes[noteIndex].tasks[taskIndex].text = e.target.value;
    }

    if (e.target.classList.contains('task-checkbox')) {
        const taskIndex = +e.target.closest('.task-item').dataset.taskIndex;
        notes[noteIndex].tasks[taskIndex].checked = e.target.checked;
    }

    saveNotes();
});

document.addEventListener("mousedown", (e) => {
    const noteEl = e.target.closest(".sticky-note");

    // Click on note
    if (noteEl) {
        const newIndex = +noteEl.dataset.noteIndex;

        if (newIndex !== activeNoteIndex) {
            activeNoteIndex = newIndex;
            renderAllNotes();
        }
        return;
    }

    // Ignore UI tools
    if (
        e.target.closest("#add-note-btn") ||
        e.target.closest("#trash-bin") ||
        e.target.closest("#pencil") ||
        e.target.closest("#eraser")
    ) {
        return;
    }

    // Remove focus from inputs
    if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
    ) {
        document.activeElement.blur();
    }

    // Deselect note
    if (activeNoteIndex !== null) {
        activeNoteIndex = null;
        renderAllNotes();
    }
});


// Ctrl+Enter → add task
document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "Enter" && activeNoteIndex != null) {
        notes[activeNoteIndex].tasks.push({ text: "", checked: false, scribbled: false });
        saveNotes();
        renderAllNotes();

        setTimeout(() => {
            // Find all task inputs of the active note and focus on the last one
            const inputs = document.querySelectorAll(`.note-wrapper .sticky-note[data-note-index="${activeNoteIndex}"] .task-input`);
            if (inputs.length > 0) inputs[inputs.length - 1].focus();
        }, 30);
    }
});


// ----------------------
//     Pen & Eraser
// ----------------------
magneticPen.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("type", "pen");
});

eraser.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("type", "eraser");
});

fridgeContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    const item = e.target.closest(".task-item");
    if (item) item.classList.add("drag-over");
});

fridgeContainer.addEventListener("dragleave", (e) => {
    const item = e.target.closest(".task-item");
    if (item) item.classList.remove("drag-over");
});

fridgeContainer.addEventListener("drop", (e) => {
    e.preventDefault();

    const taskItem = e.target.closest(".task-item");
    if (!taskItem) return;

    const dragType = e.dataTransfer.getData("type");
    const noteIndex = +taskItem.closest(".sticky-note").dataset.noteIndex;
    const taskIndex = +taskItem.dataset.taskIndex;
    const task = notes[noteIndex].tasks[taskIndex];

    if (dragType === "pen") {
        task.scribbled = !task.scribbled;
        task.scribbledAt = task.scribbled ? Date.now() : null;
    }

    if (dragType === "eraser") {
        notes[noteIndex].tasks.splice(taskIndex, 1);
    }

    saveNotes();
    renderAllNotes();
});


// Trash bin handling
trashBin.addEventListener("dragover", (e) => {
    e.preventDefault();
    trashBin.classList.add("drag-over");
});

trashBin.addEventListener("dragleave", () => trashBin.classList.remove("drag-over"));

trashBin.addEventListener("drop", (e) => {
    e.preventDefault();
    trashBin.classList.remove("drag-over");

    const noteId = e.dataTransfer.getData("noteId");
    const note = notes.find(n => n.id === noteId);

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

    // Convert the first day of Jalali month to Gregorian to find the weekday
    const firstDayGregorian = jalaali.toGregorian(jy, jm, 1);
    const dateObj = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);

    // Setup weekday indices (Saturday = 0, Friday = 6)
    let firstDayOfWeek = dateObj.getDay() + 1;
    if (firstDayOfWeek === 7) firstDayOfWeek = 0;

    const monthLength = jalaali.jalaaliMonthLength(jy, jm);

    // Empty cells before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        daysContainer.appendChild(emptyDiv);
    }

    // Days of the month
    for (let i = 1; i <= monthLength; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = toFarsiNumber(i);

        // Highlight Fridays
        if ((firstDayOfWeek + i - 1) % 7 === 6) {
            dayDiv.classList.add('friday');
        }

        // Highlight current day
        if (jy === todayJalali.jy && jm === todayJalali.jm && i === todayJalali.jd) {
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

// --- Calendar Toggle Section ---

const toggleBtn = document.getElementById('calendar_btn');
const calendar = document.getElementById('calendar');

// Single event listener for toggling the calendar
if (toggleBtn && calendar) {
    toggleBtn.addEventListener('click', function () {
        calendar.classList.toggle('minimized');
        document.body.classList.toggle('calendar-closed');

        if (calendar.classList.contains('minimized')) {
            toggleBtn.innerText = '+ نمایش تقویم';
        } else {
            toggleBtn.innerText = '− بستن تقویم';
        }
    });
}

// Initial calendar render
renderCalendar(currentJy, currentJm);
