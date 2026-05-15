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

        // ایجاد یک نگهدارنده کلی برای کاغذها تا در ستون‌ها از هم جدا نشوند
        const wrapper = document.createElement('div');
        wrapper.className = 'note-wrapper';
        wrapper.setAttribute('draggable', 'true');

        // اعمال چرخش و حاشیه‌های تصادفی به کل گروه
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
        // تقسیم تسک‌ها به صفحات مختلف
        do {
            const tasksLimit = pageIndex === 0 ? 4 : 5;
            const pageTasks = note.tasks.slice(taskOffset, taskOffset + tasksLimit);

            const noteDiv = document.createElement('div');
            let rotationAngle;

            // احتمال ۵ درصد برای اینکه زاویه دقیقا صفر باشد
            if (Math.random() < 0.05) {
                rotationAngle = 0;
            } else {
                // تولید یک زاویه تصادفی بین ۱ تا ۳ درجه
                let randomMagnitude = Math.random() * 2 + 1;

                // اعمال علامت (مثبت یا منفی) به زاویه
                rotationAngle = randomMagnitude * currentSign;
            }

            // اعمال چرخش به صفحه
            noteDiv.style.transform = `rotate(${rotationAngle}deg)`;

            // معکوس کردن علامت برای صفحه بعدی (اگر این صفحه مثبت بود، بعدی منفی شود و بالعکس)
            if (rotationAngle !== 0) {
                currentSign *= -1;
            }
            // const randomRotate = (Math.random() - 0.5) * 4; // چرخش تصادفی کم
            // noteDiv.style.transform = `rotate(${randomRotate}deg)`;

            noteDiv.className = `sticky-note ${note.colorClass} ${activeNoteIndex === noteIndex ? 'active' : ''}`;
            noteDiv.dataset.noteIndex = noteIndex;

            // noteDiv.style.position = 'relative'; // برای اعمال شدن z-index الزامی است
            // noteDiv.style.zIndex = 100 - pageIndex;

            // ساخت HTML تسک‌ها با ایندکس واقعی
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
                // چسب برای اتصال کاغذهای بعدی به قبلی
                innerHTML += `<div class="tape link-tape"></div>`;
                noteDiv.classList.add('chained-note');
            }

            innerHTML += `<ul class="task-list">${tasksHTML}</ul>`;
            noteDiv.innerHTML = innerHTML;

            wrapper.appendChild(noteDiv);

            taskOffset += pageTasks.length;
            pageIndex++;
        } while (taskOffset < note.tasks.length); // اگر تسکی نبود هم حداقل یک برگه ساخته می‌شود چون do-while است

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

    // click on note
    if (noteEl) {
        const newIndex = +noteEl.dataset.noteIndex;

        if (newIndex !== activeNoteIndex) {
            activeNoteIndex = newIndex;
            renderAllNotes();
        }
        return;
    }

    // ignore UI tools
    if (
        e.target.closest("#add-note-btn") ||
        e.target.closest("#trash-bin") ||
        e.target.closest("#pencil") ||
        e.target.closest("#eraser")
    ) {
        return;
    }

    // remove focus from inputs
    if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
    ) {
        document.activeElement.blur();
    }

    // deselect note
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
            // پیدا کردن تمام اینپوت‌های تسک این نوت و فوکوس روی آخرین مورد
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
    monthYearDisplay.textContent = `${monthNames[jm - 1]} ${jy}`;

    // تبدیل روز اول ماه شمسی به میلادی برای پیدا کردن روز هفته
    const firstDayGregorian = jalaali.toGregorian(jy, jm, 1);
    const dateObj = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);

    // تنظیم روز هفته (شنبه = 0، جمعه = 6)
    let firstDayOfWeek = dateObj.getDay() + 1;
    if (firstDayOfWeek === 7) firstDayOfWeek = 0;

    const monthLength = jalaali.jalaaliMonthLength(jy, jm);

    // سلول‌های خالی قبل از شروع ماه
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        daysContainer.appendChild(emptyDiv);
    }

    // روزهای ماه
    for (let i = 1; i <= monthLength; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = i;

        // مشخص کردن جمعه‌ها
        if ((firstDayOfWeek + i - 1) % 7 === 6) {
            dayDiv.classList.add('friday');
        }

        // مشخص کردن روز فعلی
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

const toggleBtn = document.getElementById('toggleCalendarBtn');
const calendar = document.getElementById('myCalendar');

toggleBtn.addEventListener('click', function() {
    // تغییر وضعیت کلاس ها
    calendar.classList.toggle('minimized');
    document.body.classList.toggle('calendar-closed');
    
    // تغییر متن دکمه
    if (calendar.classList.contains('minimized')) {
        toggleBtn.innerText = '+ نمایش تقویم';
    } else {
        toggleBtn.innerText = '− بستن تقویم';
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // پیدا کردن دکمه و خود تقویم
    const toggleBtn = document.getElementById("toggleCalendarBtn");
    const calendar = document.getElementById("myCalendar");

    // اگر هر دو در HTML پیدا شدند، دستورات کلیک را اضافه کن
    if (toggleBtn && calendar) {
        toggleBtn.addEventListener("click", function() {
            // اضافه یا حذف کردن کلاس‌ها
            calendar.classList.toggle("minimized");
            document.body.classList.toggle("calendar-closed");

            // تغییر متن دکمه بر اساس وضعیت تقویم
            if (calendar.classList.contains("minimized")) {
                toggleBtn.innerText = "+ باز کردن تقویم";
            } else {
                toggleBtn.innerText = "− بستن تقویم";
            }
        });
    } else {
        console.log("دکمه toggleCalendarBtn یا تقویم myCalendar در HTML یافت نشد.");
    }
});

// رندر اولیه
renderCalendar(currentJy, currentJm);