// const fridgeContainer = document.getElementById('fridge-container');
// const addNoteBtn = document.getElementById('add-note-btn');

// let notes = [];

// const getRandomColorClass = () => `color-${Math.floor(Math.random() * 4)}`;

// function loadNotes() {
//     chrome.storage.local.get(['fridgeNotes'], function(result) {
//         if (result.fridgeNotes) {
//             notes = result.fridgeNotes;
//             renderAllNotes();
//         }
//     });
// }

// function saveNotes() {
//     chrome.storage.local.set({ 'fridgeNotes': notes });
// }

// function createNoteElement(note, noteIndex) {
//     const noteDiv = document.createElement('div');
//     noteDiv.className = `sticky-note ${note.colorClass}`;
//     noteDiv.style.transform = `rotate(${Math.random() * 4 - 2}deg)`;

//     noteDiv.innerHTML = `
//         <input type="text" class="note-title" value="${note.title}" placeholder="عنوان لیست..." onchange="updateNoteTitle(${noteIndex}, this.value)">
//         <ul class="task-list" id="list-${note.id}">
//             ${note.tasks.map((task, taskIndex) => `
//                 <li class="task-item ${task.scribbled ? 'scribbled' : ''}">
//                     <input type="checkbox" ${task.checked ? 'checked' : ''} onchange="toggleCheck(${noteIndex}, ${taskIndex})">
//                     <input type="text" class="task-input" value="${task.text}" placeholder="تسک..." onchange="updateTaskText(${noteIndex}, ${taskIndex}, this.value)">
//                     <button class="btn-scribble" onclick="toggleScribble(${noteIndex}, ${taskIndex})" title="خط‌خطیش کن!">🖍️</button>
//                 </li>
//             `).join('')}
//         </ul>
//         <button class="add-task-btn" onclick="addTask(${noteIndex})">+ تسک جدید</button>
//     `;
//     return noteDiv;
// }

// function renderAllNotes() {
//     fridgeContainer.innerHTML = '';
//     notes.forEach((note, index) => {
//         fridgeContainer.appendChild(createNoteElement(note, index));
//     });
// }

// addNoteBtn.addEventListener('click', () => {
//     notes.push({
//         id: Date.now(),
//         title: '',
//         colorClass: getRandomColorClass(),
//         tasks: [{ text: '', checked: false, scribbled: false }]
//     });
//     saveNotes();
//     renderAllNotes();
// });

// window.updateNoteTitle = (noteIndex, value) => { notes[noteIndex].title = value; saveNotes(); };
// window.updateTaskText = (noteIndex, taskIndex, value) => { notes[noteIndex].tasks[taskIndex].text = value; saveNotes(); };
// window.toggleCheck = (noteIndex, taskIndex) => { 
//     notes[noteIndex].tasks[taskIndex].checked = !notes[noteIndex].tasks[taskIndex].checked; 
//     saveNotes(); 
//     renderAllNotes();
// };
// window.toggleScribble = (noteIndex, taskIndex) => { 
//     notes[noteIndex].tasks[taskIndex].scribbled = !notes[noteIndex].tasks[taskIndex].scribbled; 
//     saveNotes(); 
//     renderAllNotes();
// };
// window.addTask = (noteIndex) => {
//     notes[noteIndex].tasks.push({ text: '', checked: false, scribbled: false });
//     saveNotes();
//     renderAllNotes();
// };

// loadNotes();


const fridgeContainer = document.getElementById('fridge-container');
const addNoteBtn = document.getElementById('add-note-btn');

let notes = [];
let activeNoteIndex = null;
const DELETE_HOURS = 2;
const DELETE_THRESHOLD_MS = DELETE_HOURS * 60 * 60 * 1000;

const getRandomColorClass = () => `color-${Math.floor(Math.random() * 4)}`;

function cleanupOldScribbles() {
    let changed = false;
    const now = Date.now();
    notes.forEach(note => {
        const initialLen = note.tasks.length;
        note.tasks = note.tasks.filter(task => {
            if (task.scribbled && task.scribbledAt && (now - task.scribbledAt > DELETE_THRESHOLD_MS)) {
                return false; // پاک کردن تسک
            }
            return true;
        });
        if (note.tasks.length !== initialLen) changed = true;
    });
    if (changed) { saveNotes(); renderAllNotes(); }
}

function loadNotes() {
    chrome.storage.local.get(['fridgeNotes'], function(result) {
        if (result.fridgeNotes) notes = result.fridgeNotes;
        cleanupOldScribbles();
        renderAllNotes();
    });
}

function saveNotes() {
    chrome.storage.local.set({ 'fridgeNotes': notes });
}

// function renderAllNotes() {
//     fridgeContainer.innerHTML = '';
//     notes.forEach((note, noteIndex) => {
//         const noteDiv = document.createElement('div');
//         noteDiv.className = `sticky-note ${note.colorClass} ${activeNoteIndex === noteIndex ? 'active' : ''}`;
//         noteDiv.style.transform = `rotate(${Math.random() * 2 - 1}deg)`;
//         noteDiv.dataset.noteIndex = noteIndex;

//         let tasksHTML = note.tasks.map((task, taskIndex) => `
//             <li class="task-item ${task.scribbled ? 'scribbled' : ''}" data-task-index="${taskIndex}">
//                 <input type="checkbox" class="task-checkbox" ${task.checked ? 'checked' : ''}>
//                 <input type="text" class="task-input" value="${task.text}" placeholder="Task...">
//             </li>
//         `).join('');

//         noteDiv.innerHTML = `
//             <div class="magnetic-pen" draggable="true" title="Drag me to a task to scribble!">🖍️</div>
//             <input type="text" class="note-title" value="${note.title}" placeholder="Note Title...">
//             <ul class="task-list">${tasksHTML}</ul>
//         `;
//         fridgeContainer.appendChild(noteDiv);
//     });
// }
function renderAllNotes() {
    fridgeContainer.innerHTML = '';
    notes.forEach((note, noteIndex) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = `sticky-note ${note.colorClass} ${activeNoteIndex === noteIndex ? 'active' : ''}`;
        
        // در زمان ساخت یا آپدیت نوت:
        if (note.tasks.length > 6) { 
            noteDiv.classList.add('multi-page');
        } else {
            noteDiv.classList.remove('multi-page');
        }

        // نامرتب‌سازی طبیعی‌تر (چرخش بین 3- تا 3 درجه و جابجایی تصادفی)
        const rotate = (Math.random() * 6) - 3; 
        const marginTop = Math.random() * 15;
        const marginLeft = (Math.random() * 10) - 5;
        
        noteDiv.style.transform = `rotate(${rotate}deg)`;
        noteDiv.style.marginTop = `${marginTop}px`;
        noteDiv.style.marginLeft = `${marginLeft}px`;
        noteDiv.dataset.noteIndex = noteIndex;


        let tasksHTML = note.tasks.map((task, taskIndex) => `
            <li class="task-item ${task.scribbled ? 'scribbled' : ''}" data-task-index="${taskIndex}">
                <input type="checkbox" class="task-checkbox" ${task.checked ? 'checked' : ''}>
                <input type="text" class="task-input" value="${task.text}" placeholder="Task...">
            </li>
        `).join('');

        noteDiv.innerHTML = `
            <input type="text" class="note-title" value="${note.title}" placeholder="Note Title...">
            <ul class="task-list">${tasksHTML}</ul>
        `;
        fridgeContainer.appendChild(noteDiv);
    });
}


// اضافه کردن نوت جدید
addNoteBtn.addEventListener('click', () => {
    notes.push({ title: '', colorClass: getRandomColorClass(), tasks: [{ text: '', checked: false, scribbled: false }] });
    activeNoteIndex = notes.length - 1;
    saveNotes(); renderAllNotes();
});

// Event Delegation برای آپدیت فیلدها (جایگزین onclick های داخل HTML)
fridgeContainer.addEventListener('change', (e) => {
    const noteElement = e.target.closest('.sticky-note');
    if (!noteElement) return;
    const noteIndex = parseInt(noteElement.dataset.noteIndex);

    if (e.target.classList.contains('note-title')) {
        notes[noteIndex].title = e.target.value;
    } else if (e.target.classList.contains('task-input')) {
        const taskIndex = parseInt(e.target.closest('.task-item').dataset.taskIndex);
        notes[noteIndex].tasks[taskIndex].text = e.target.value;
    } else if (e.target.classList.contains('task-checkbox')) {
        const taskIndex = parseInt(e.target.closest('.task-item').dataset.taskIndex);
        notes[noteIndex].tasks[taskIndex].checked = e.target.checked;
    }
    saveNotes();
});

// مدیریت سلکت شدن نوت با کلیک
fridgeContainer.addEventListener('click', (e) => {
    const noteElement = e.target.closest('.sticky-note');
    if (noteElement) {
        const index = parseInt(noteElement.dataset.noteIndex);
        if (activeNoteIndex !== index) {
            activeNoteIndex = index;
            renderAllNotes();
        }
    } else {
        activeNoteIndex = null;
        renderAllNotes();
    }
});

// مدیریت شورتکات Ctrl+Enter برای افزودن تسک به نوت فعال
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter' && activeNoteIndex !== null) {
        notes[activeNoteIndex].tasks.push({ text: '', checked: false, scribbled: false });
        saveNotes();
        renderAllNotes();
        
        // فوکوس روی اینپوت جدید
        setTimeout(() => {
            const activeNoteEl = document.querySelector(`.sticky-note[data-note-index="${activeNoteIndex}"]`);
            const inputs = activeNoteEl.querySelectorAll('.task-input');
            if(inputs.length > 0) inputs[inputs.length - 1].focus();
        }, 50);
    }
});

// --- منطق Drag and Drop برای مداد ---
// let draggedPenNoteIndex = null;

// fridgeContainer.addEventListener('dragstart', (e) => {
//     if (e.target.classList.contains('magnetic-pen')) {
//         draggedPenNoteIndex = parseInt(e.target.closest('.sticky-note').dataset.noteIndex);
//         e.dataTransfer.effectAllowed = 'move';
//     }
// });

// fridgeContainer.addEventListener('dragover', (e) => {
//     e.preventDefault(); // لازم برای اجازه drop
//     const taskItem = e.target.closest('.task-item');
//     if (taskItem) taskItem.classList.add('drag-over');
// });

// fridgeContainer.addEventListener('dragleave', (e) => {
//     const taskItem = e.target.closest('.task-item');
//     if (taskItem) taskItem.classList.remove('drag-over');
// });

// fridgeContainer.addEventListener('drop', (e) => {
//     e.preventDefault();
//     const taskItem = e.target.closest('.task-item');
//     if (taskItem) {
//         taskItem.classList.remove('drag-over');
//         const noteIndex = parseInt(taskItem.closest('.sticky-note').dataset.noteIndex);
//         const taskIndex = parseInt(taskItem.dataset.taskIndex);
        
//         // فقط اگر مداد مربوط به همان نوت باشد عمل کند (اختیاری)
//         if (noteIndex === draggedPenNoteIndex) {
//             notes[noteIndex].tasks[taskIndex].scribbled = !notes[noteIndex].tasks[taskIndex].scribbled;
//             saveNotes(); renderAllNotes();
//         }
//     }
// });

const magneticPen = document.getElementById('magnetic-pen');

magneticPen.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'copyMove';
});

fridgeContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    const taskItem = e.target.closest('.task-item');
    if (taskItem) taskItem.classList.add('drag-over');
});

fridgeContainer.addEventListener('dragleave', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (taskItem) taskItem.classList.remove('drag-over');
});

fridgeContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const taskItem = e.target.closest('.task-item');
    if (taskItem) {
        taskItem.classList.remove('drag-over');
        const noteIndex = parseInt(taskItem.closest('.sticky-note').dataset.noteIndex);
        const taskIndex = parseInt(taskItem.dataset.taskIndex);
        
        let task = notes[noteIndex].tasks[taskIndex];
        task.scribbled = !task.scribbled;
        
        // ثبت زمان خط‌خوردگی
        if (task.scribbled) {
            task.scribbledAt = Date.now();
        } else {
            delete task.scribbledAt; // اگر از حالت خط‌خورده در آمد
        }
        
        saveNotes(); renderAllNotes();
    }
});

setInterval(cleanupOldScribbles, 5 * 60 * 1000);

loadNotes();


