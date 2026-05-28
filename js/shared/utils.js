export function formatJalaliKey(jy, jm, jd) {
    const mm = String(jm).padStart(2, "0");
    const dd = String(jd).padStart(2, "0");
    return `${jy}-${mm}-${dd}`;
}

const persianNumbers = [/0/g, /1/g, /2/g, /3/g, /4/g, /5/g, /6/g, /7/g, /8/g, /9/g];
const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];

export function convertToPersian(str) {
    if (typeof str === 'string') {
        for (let i = 0; i < 10; i++) {
            str = str
                .replace(persianNumbers[i], String.fromCharCode(i + 1776))
                .replace(arabicNumbers[i], String.fromCharCode(i + 1776));
        }
    }
    return str;
}

export const toFarsiNumber = (n) =>
    n.toString().replace(/\d/g, x => "۰۱۲۳۴۵۶۷۸۹"[x]);

export function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export const DELETE_HOURS = 2;
export const DELETE_THRESHOLD_MS = DELETE_HOURS * 60 * 60 * 1000;

export const ONE_DAY = 24 * 60 * 60 * 1000;

export const getRandomColorClass = () => `color-${Math.floor(Math.random() * 4)}`;

export function applyPersianTextConversion() {
    document.querySelectorAll('.persian-text').forEach(el => {
        el.innerHTML = convertToPersian(el.innerHTML);
    });
}
