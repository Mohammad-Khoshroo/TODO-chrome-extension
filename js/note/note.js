import {
    notes,
    activeNoteIndex,
    noteLayouts,
    msnry,
    setMsnry,
    setNoteLayout
} from "../main/state.js";

import { saveNotes } from "../shared/storage.js";
import {
    DELETE_THRESHOLD_MS,
    ONE_DAY,
    escapeHTML,
    getRandomColorClass
} from "../shared/utils.js";

import { updateTrashIcon } from "../UI/trash-bin.js";

const fridgeContainer = document.getElementById('container');

export function autoResizeTextareas() {
    document.querySelectorAll('.note-task-text, .note-title').forEach(t => {
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
    });
}

export function createRandomNoteLayout(note) {
    let taskOffset = 0;
    let pageIndex = 0;
    let currentSign = Math.random() > 0.5 ? 1 : -1;
    const pageRotations = [];

    do {
        const tasksLimit = pageIndex === 0 ? 4 : 5;
        const pageTasks = note.tasks.slice(taskOffset, taskOffset + tasksLimit);

        let rotationAngle;

        if (Math.random() < 0.05) {
            rotationAngle = 0;
        } else {
            const randomMagnitude = Math.random() * 2 + 1;
            rotationAngle = randomMagnitude * currentSign;
        }

        if (rotationAngle !== 0) {
            currentSign *= -1;
        }

        pageRotations.push(rotationAngle);

        taskOffset += pageTasks.length;
        pageIndex++;
    } while (taskOffset < note.tasks.length);

    return {
        wrapperRotation: (Math.random() * 6) - 3,
        marginTop: Math.random() * 15 + 40,
        marginLeft: (Math.random() * 10) - 5,
        pageRotations
    };
}

export function renderAllNotes() {
    fridgeContainer.innerHTML = '';

    notes.forEach((note, noteIndex) => {
        if (note.deletedAt) return;

        if (!note.id) {
            note.id = 'note_' + Date.now() + '_' + Math.random();
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'note-wrapper';
        wrapper.draggable = true;

        if (!noteLayouts[note.id]) {
            setNoteLayout(note.id, createRandomNoteLayout(note));
        }

        const layout = noteLayouts[note.id];

        const expectedPages = (() => {
            if (note.tasks.length <= 4) return 1;
            return 1 + Math.ceil((note.tasks.length - 4) / 5);
        })();

        if (layout.pageRotations.length !== expectedPages) {
            setNoteLayout(note.id, createRandomNoteLayout(note));
        }

        const finalLayout = noteLayouts[note.id];

        wrapper.style.transform = `rotate(${finalLayout.wrapperRotation}deg)`;
        wrapper.style.marginTop = `${finalLayout.marginTop}px`;
        wrapper.style.marginLeft = `${finalLayout.marginLeft}px`;

        let taskOffset = 0;
        let pageIndex = 0;

        do {
            const tasksLimit = pageIndex === 0 ? 4 : 5;
            const pageTasks = note.tasks.slice(taskOffset, taskOffset + tasksLimit);

            const noteDiv = document.createElement('div');
            const rotationAngle = finalLayout.pageRotations[pageIndex] ?? 0;
            noteDiv.style.transform = `rotate(${rotationAngle}deg)`;

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
                            class="note-task-text ${task.text.trim() ? 'locked-task' : 'editing-task'}" 
                            rows="1" 
                            draggable="false"
                            placeholder="task. . ."
                            ${task.text.trim() ? 'readonly' : ''}>${escapeHTML(task.text)}</textarea>
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

        const instance = new Masonry(fridgeContainer, {
            itemSelector: '.note-wrapper',
            gutter: 20,
            fitWidth: true,
            transitionDuration: '0.2s'
        });

        setMsnry(instance);
    }, 50);
}

export function cleanupOldScribbles() {
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

export function cleanupTrash() {
    const now = Date.now();

    const filtered = notes.filter(n => !n.deletedAt || now - n.deletedAt < ONE_DAY);
    notes.length = 0;
    notes.push(...filtered);

    saveNotes();
    updateTrashIcon();
}

export function addNewNote() {
    const newNote = {
        id: 'note_' + Date.now(),
        title: '',
        colorClass: getRandomColorClass(),
        tasks: [{ text: '', checked: false, scribbled: false }]
    };

    newNote.layout = createRandomNoteLayout(newNote);

    notes.push(newNote);
    saveNotes();
    renderAllNotes();

    return notes.length - 1;
}
