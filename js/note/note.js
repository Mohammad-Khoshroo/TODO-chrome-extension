// ----------------------
//       RENDERING
// ----------------------
function autoResizeTextareas() {
    document.querySelectorAll('.note-task-text, .note-title').forEach(t => {
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
    });
}

function createRandomNoteLayout(note) {
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

        if (!noteLayouts[note.id]) {
            noteLayouts[note.id] = createRandomNoteLayout(note);
        }

        const layout = noteLayouts[note.id];

        const expectedPages = (() => {
            if (note.tasks.length <= 4) return 1;
            return 1 + Math.ceil((note.tasks.length - 4) / 5);
        })();

        if (layout.pageRotations.length !== expectedPages) {
            noteLayouts[note.id] = createRandomNoteLayout(note);
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
    renderCalendar(currentJy, currentJm);
    updateDeadlinePanel(selectedDeadlineKey);

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
    const newNote = {
        id: 'note_' + Date.now(),
        title: '',
        colorClass: getRandomColorClass(),
        tasks: [{ text: '', checked: false, scribbled: false }]
    };

    newNote.layout = createRandomNoteLayout(newNote);

    notes.push(newNote);

    activeNoteIndex = notes.length - 1;
    saveNotes();
    renderAllNotes();
});

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
        e.target.closest("#pen") ||
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
