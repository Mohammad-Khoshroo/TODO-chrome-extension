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
let selectedDeadlineKey = formatJalaliKey(todayJalali.jy, todayJalali.jm, todayJalali.jd);

function getTaskDeadlineKey(task) {
    if (!task || !task.deadline) return null;

    if (typeof task.deadline === "string") {
        return task.deadline;
    }

    if (
        typeof task.deadline === "object" &&
        task.deadline.jy &&
        task.deadline.jm &&
        task.deadline.jd
    ) {
        return formatJalaliKey(task.deadline.jy, task.deadline.jm, task.deadline.jd);
    }

    return null;
}

function getTasksByDeadlineKey(deadlineKey) {
    const items = [];

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;

        (note.tasks || []).forEach((task, taskIndex) => {
            if (getTaskDeadlineKey(task) === deadlineKey) {
                items.push({
                    noteIndex,
                    taskIndex,
                    note,
                    task
                });
            }
        });
    });

    return items;
}

function getAllDeadlineKeys() {
    const keys = new Set();

    notes.forEach(note => {
        if (note.deletedAt) return;

        (note.tasks || []).forEach(task => {
            const key = getTaskDeadlineKey(task);
            if (key) keys.add(key);
        });
    });

    return keys;
}

function parseJalaliKey(key) {
    const [jy, jm, jd] = String(key).split("-").map(Number);
    return { jy, jm, jd };
}

function formatPersianDeadlineTitle(key) {
    const { jy, jm, jd } = parseJalaliKey(key);
    return `${toFarsiNumber(jd)} ${monthNames[jm - 1]} ${toFarsiNumber(jy)}`;
}

function updateDeadlinePanel(deadlineKey) {
    const titleEl = document.getElementById("deadline-panel-title");
    const listEl = document.getElementById("deadline-list");

    if (!titleEl || !listEl) return;

    const items = getTasksByDeadlineKey(deadlineKey);

    titleEl.textContent = `ددلاین‌های ${formatPersianDeadlineTitle(deadlineKey)}`;
    listEl.innerHTML = "";

    if (!items.length) {
        listEl.innerHTML = `<div class="deadline-empty">ددلاینی برای این روز وجود ندارد</div>`;
        return;
    }

    items.forEach(({ note, task, noteIndex }) => {
        const item = document.createElement("div");
        item.className = `deadline-item ${task.checked ? "done" : ""}`;

        item.innerHTML = `
            <div class="deadline-item-note">${escapeHTML(note.title?.trim() || "بدون عنوان")}</div>
            <div class="deadline-item-text">${escapeHTML(task.text?.trim() || "(بدون متن)")}</div>
        `;

        item.addEventListener("click", () => {
            activeNoteIndex = noteIndex;
            renderAllNotes();
        });

        listEl.appendChild(item);
    });

}

function renderCalendar(jy, jm) {
    const daysContainer = document.getElementById('daysContainer');
    const monthYearDisplay = document.getElementById('monthYear');

    daysContainer.innerHTML = '';
    monthYearDisplay.textContent = `${monthNames[jm - 1]} ${toFarsiNumber(jy)}`;

    const deadlineKeys = getAllDeadlineKeys();

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
        const dayKey = formatJalaliKey(jy, jm, i);

        dayDiv.classList.add('day');
        dayDiv.textContent = toFarsiNumber(i);
        dayDiv.dataset.dateKey = dayKey;

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

        if (deadlineKeys.has(dayKey)) {
            dayDiv.classList.add('has-deadline');
        }

        if (selectedDeadlineKey === dayKey) {
            dayDiv.classList.add('selected-deadline-day');
        }

        dayDiv.addEventListener("click", () => {
            selectedDeadlineKey = dayKey;
            renderCalendar(currentJy, currentJm);
            updateDeadlinePanel(dayKey);
        });

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
