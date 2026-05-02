const fridgeContainer = document.getElementById('fridge-container');
const addNoteBtn = document.getElementById('add-note-btn');
const trashBin = document.getElementById('trash-bin');

let notes = [];
let activeNoteIndex = null;
const DELETE_HOURS = 2;
const DELETE_THRESHOLD_MS = DELETE_HOURS * 60 * 60 * 1000;

const getRandomColorClass = () => `color-${Math.floor(Math.random() * 4)}`;


function autoResizeTextareas() {
    const textareas = document.querySelectorAll('.task-input, .note-title');
    textareas.forEach(textarea => {
        textarea.style.height = 'auto'; // ریست کردن ارتفاع
        textarea.style.height = textarea.scrollHeight + 'px'; // تنظیم با محتوا
    });
}



function cleanupOldScribbles() {
    let changed = false;
    const now = Date.now();
    notes.forEach(note => {
        const initialLen = note.tasks.length;
        note.tasks = note.tasks.filter(task => {
            if (task.scribbled && task.scribbledAt && (now - task.scribbledAt > DELETE_THRESHOLD_MS)) {
                return false;
            }
            return true;
        });
        if (note.tasks.length !== initialLen) changed = true;
    });
    if (changed) { saveNotes(); renderAllNotes(); }
}

function loadNotes() {
    chrome.storage.local.get(['fridgeNotes'], function (result) {
        if (result.fridgeNotes) notes = result.fridgeNotes;
        cleanupOldScribbles();
        cleanupTrash();
        renderAllNotes();
    });
}

function saveNotes() {
    chrome.storage.local.set({ 'fridgeNotes': notes });
}

function renderAllNotes() {
    fridgeContainer.innerHTML = '';
    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return; 

        const noteDiv = document.createElement('div');
        noteDiv.className = `sticky-note ${note.colorClass} ${activeNoteIndex === noteIndex ? 'active' : ''}`;
        
        noteDiv.setAttribute('draggable', 'true');
        
        noteDiv.addEventListener('dragstart', (e) => {
            if (!note.id) note.id = 'note_' + Date.now() + Math.random();
            e.dataTransfer.setData('noteId', note.id);
        });
        
        if (note.tasks.length > 6) {
            noteDiv.classList.add('multi-page');
        } else {
            noteDiv.classList.remove('multi-page');
        }
        
        const rotate = (Math.random() * 6) - 3;
        const marginTop = Math.random() * 15;
        const marginLeft = (Math.random() * 10) - 5;
        
        // خطای undefined color حذف شد، رنگ از طریق کلاس‌ها (CSS) مدیریت می‌شود
        noteDiv.style.transform = `rotate(${rotate}deg)`;
        noteDiv.style.marginTop = `${marginTop}px`;
        noteDiv.style.marginLeft = `${marginLeft}px`;
        noteDiv.dataset.noteIndex = noteIndex;

        let tasksHTML = note.tasks.map((task, taskIndex) => `
            <li class="task-item ${task.scribbled ? 'scribbled' : ''}" data-task-index="${taskIndex}">
                <input type="checkbox" class="task-checkbox" ${task.checked ? 'checked' : ''}>
                <textarea class="task-input" placeholder="Task..." rows="1" oninput="this.style.height='auto'; this.style.height=this.scrollHeight+'px';">${task.text}</textarea>
            </li>
        `).join('');


        noteDiv.innerHTML = `
            <input type="text" class="note-title" value="${note.title}" placeholder="Note Title...">
            <ul class="task-list">${tasksHTML}</ul>
        `;
        fridgeContainer.appendChild(noteDiv);
    });
}

addNoteBtn.addEventListener('click', () => {
    notes.push({ 
        id: 'note_' + Date.now(),
        title: '', 
        colorClass: getRandomColorClass(), 
        tasks: [{ text: '', checked: false, scribbled: false }] 
    });

    activeNoteIndex = notes.length - 1;
    saveNotes(); renderAllNotes();
});

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

document.addEventListener('mousedown', (e) => {
    // بررسی اینکه کلیک خارج از نوت، مداد، پاک‌کن و سطل زباله باشد
    if (!e.target.closest('.sticky-note') && 
        !e.target.closest('#magnet-pencil') &&
        !e.target.closest('#magnet-eraser') &&
        !e.target.closest('#trash-bin')) {
        
        // برداشتن فوکوس از تکست‌اریا یا اینپوت فعال
        if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')) {
            document.activeElement.blur();
        }

        // اگر کلاسی برای حالت انتخاب شده (مثل selected یا focused) به نوت‌ها می‌دهید، آن را حذف کنید
        document.querySelectorAll('.sticky-note').forEach(note => {
            note.classList.remove('selected'); // در صورت استفاده از این کلاس در CSS
            note.style.zIndex = ''; // برگرداندن z-index به حالت پیش‌فرض (اختیاری)
        });
    }
});


document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter' && activeNoteIndex !== null) {
        notes[activeNoteIndex].tasks.push({ text: '', checked: false, scribbled: false });
        saveNotes();
        renderAllNotes();

        setTimeout(() => {
            const activeNoteEl = document.querySelector(`.sticky-note[data-note-index="${activeNoteIndex}"]`);
            const inputs = activeNoteEl.querySelectorAll('.task-input');
            if (inputs.length > 0) inputs[inputs.length - 1].focus();
        }, 50);
    }
});

const magneticPen = document.getElementById('magnetic-pen');

magneticPen.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'copyMove';
    // شناسه‌ای برای تشخیص اینکه آیا مداد کشیده شده است یا خیر
    e.dataTransfer.setData('type', 'pen'); 
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
    
    // اگر عنصری که رها شده نوت است، متوقف شود
    if (e.dataTransfer.getData('noteId')) return;

    // تشخیص اینکه مداد رها شده یا پاک‌کن
    const dragType = e.dataTransfer.getData('type');

    if (taskItem) {
        taskItem.classList.remove('drag-over');
        
        const stickyNote = taskItem.closest('.sticky-note');
        if (!stickyNote || !stickyNote.dataset.noteIndex) return;

        const noteIndex = parseInt(stickyNote.dataset.noteIndex);
        const taskIndex = parseInt(taskItem.dataset.taskIndex);

        if (!isNaN(noteIndex) && !isNaN(taskIndex) && notes[noteIndex] && notes[noteIndex].tasks[taskIndex]) {
            
            if (dragType === 'pen') {
                // منطق مداد: خط‌خطی کردن تسک
                let task = notes[noteIndex].tasks[taskIndex];
                task.scribbled = !task.scribbled;

                if (task.scribbled) {
                    task.scribbledAt = Date.now();
                } else {
                    delete task.scribbledAt;
                }
            } else if (dragType === 'eraser') {
                // منطق پاک‌کن: حذف آنی و کامل تسک
                notes[noteIndex].tasks.splice(taskIndex, 1);
            }

            saveNotes(); 
            renderAllNotes();
        }
    }
});


trashBin.addEventListener('dragover', (e) => {
    e.preventDefault();
    trashBin.classList.add('drag-over');
});

trashBin.addEventListener('dragleave', () => {
    trashBin.classList.remove('drag-over');
});

trashBin.addEventListener('drop', (e) => {
    e.preventDefault();
    trashBin.classList.remove('drag-over');

    const noteId = e.dataTransfer.getData('noteId');
    const note = notes.find(n => n.id === noteId);

    if (note) {
        note.deletedAt = Date.now();
        note.isCrumpled = true;
        saveNotes();
        renderAllNotes();
    }
});

function cleanupTrash() {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    notes = notes.filter(n => !n.deletedAt || (now - n.deletedAt < ONE_DAY_MS));
    saveNotes();
}

const eraser = document.getElementById('magnetic-eraser');

eraser.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', 'eraser');
    e.dataTransfer.effectAllowed = 'copy';
});


setInterval(cleanupOldScribbles, 5 * 60 * 1000);

loadNotes();
