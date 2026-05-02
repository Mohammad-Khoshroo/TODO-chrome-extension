const fridgeContainer = document.getElementById('fridge-container');
const addNoteBtn = document.getElementById('add-note-btn');

let notes = [];

const getRandomColorClass = () => `color-${Math.floor(Math.random() * 4)}`;

function loadNotes() {
    chrome.storage.local.get(['fridgeNotes'], function(result) {
        if (result.fridgeNotes) {
            notes = result.fridgeNotes;
            renderAllNotes();
        }
    });
}

function saveNotes() {
    chrome.storage.local.set({ 'fridgeNotes': notes });
}

function createNoteElement(note, noteIndex) {
    const noteDiv = document.createElement('div');
    noteDiv.className = `sticky-note ${note.colorClass}`;
    noteDiv.style.transform = `rotate(${Math.random() * 4 - 2}deg)`;

    noteDiv.innerHTML = `
        <input type="text" class="note-title" value="${note.title}" placeholder="عنوان لیست..." onchange="updateNoteTitle(${noteIndex}, this.value)">
        <ul class="task-list" id="list-${note.id}">
            ${note.tasks.map((task, taskIndex) => `
                <li class="task-item ${task.scribbled ? 'scribbled' : ''}">
                    <input type="checkbox" ${task.checked ? 'checked' : ''} onchange="toggleCheck(${noteIndex}, ${taskIndex})">
                    <input type="text" class="task-input" value="${task.text}" placeholder="تسک..." onchange="updateTaskText(${noteIndex}, ${taskIndex}, this.value)">
                    <button class="btn-scribble" onclick="toggleScribble(${noteIndex}, ${taskIndex})" title="خط‌خطیش کن!">🖍️</button>
                </li>
            `).join('')}
        </ul>
        <button class="add-task-btn" onclick="addTask(${noteIndex})">+ تسک جدید</button>
    `;
    return noteDiv;
}

function renderAllNotes() {
    fridgeContainer.innerHTML = '';
    notes.forEach((note, index) => {
        fridgeContainer.appendChild(createNoteElement(note, index));
    });
}

addNoteBtn.addEventListener('click', () => {
    notes.push({
        id: Date.now(),
        title: '',
        colorClass: getRandomColorClass(),
        tasks: [{ text: '', checked: false, scribbled: false }]
    });
    saveNotes();
    renderAllNotes();
});

window.updateNoteTitle = (noteIndex, value) => { notes[noteIndex].title = value; saveNotes(); };
window.updateTaskText = (noteIndex, taskIndex, value) => { notes[noteIndex].tasks[taskIndex].text = value; saveNotes(); };
window.toggleCheck = (noteIndex, taskIndex) => { 
    notes[noteIndex].tasks[taskIndex].checked = !notes[noteIndex].tasks[taskIndex].checked; 
    saveNotes(); 
    renderAllNotes();
};
window.toggleScribble = (noteIndex, taskIndex) => { 
    notes[noteIndex].tasks[taskIndex].scribbled = !notes[noteIndex].tasks[taskIndex].scribbled; 
    saveNotes(); 
    renderAllNotes();
};
window.addTask = (noteIndex) => {
    notes[noteIndex].tasks.push({ text: '', checked: false, scribbled: false });
    saveNotes();
    renderAllNotes();
};

loadNotes();
