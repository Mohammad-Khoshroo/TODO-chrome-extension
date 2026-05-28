import { toFarsiNumber } from "../shared/utils.js";
import { getSavedCalendarState, saveCalendarState } from "../shared/storage.js";

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

const toggleBtn = document.getElementById('calendar-btn');
const calendar = document.getElementById('calendar');

export function renderCalendar(jy, jm) {
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

export function applyCalendarState(isMinimized) {
    calendar.classList.toggle('minimized', isMinimized);
    document.body.classList.toggle('calendar-closed', isMinimized);

    toggleBtn.innerText = isMinimized
        ? '+ نمایش تقویم'
        : '− بستن تقویم';
}

export function initCalendar() {
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
}
