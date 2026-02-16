const API_URL = '';
let allNotes = [];
let currentFile = null;
let currentFileType = null;
let currentFileName = null;

document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    document.getElementById('noteFile').addEventListener('change', handleFileUpload);
});

async function loadNotes() {
    try {
        const response = await fetch(`${API_URL}/notes`);
        allNotes = await response.json();
        renderNotes(allNotes);
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

function renderNotes(notes) {
    const notesList = document.getElementById('notesList');
    const countBadge = document.getElementById('countBadge');

    notesList.innerHTML = '';

    // Update count if badge exists
    if (countBadge) {
        countBadge.innerText = notes.length.toString().padStart(2, '0');
    }

    if (notes.length === 0) {
        notesList.innerHTML = '<div class="no-results">// NO_DATA_FOUND</div>';
        return;
    }

    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <div class="note-header">
                <div class="note-info">
                    <h3>${note.name}</h3>
                    <small>Created: ${new Date(note.created_at).toLocaleString()}</small>
                </div>
                ${renderFileDisplay(note)}
                <div class="note-actions">
                    <button class="view-btn" onclick="toggleCode(${note.id})">View</button>
                    <button class="copy-btn" onclick="copyToClipboard(${note.id})">Copy</button>
                    ${note.image_data ? `<button class="download-file-btn" onclick="downloadFile(${note.id})">Download ${note.file_type && note.file_type.startsWith('image/') ? 'Image' : 'File'}</button>` : ''}
                    <button class="edit-btn" onclick="editNote(${note.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteNote(${note.id})">Delete</button>
                </div>
            </div>
            <div id="code-${note.id}" class="code-display">
                <pre><code>${escapeHtml(note.code)}</code></pre>
            </div>
        `;
        notesList.appendChild(noteCard);
    });
}

function filterNotes() {
    const query = document.getElementById('searchNotes').value.toLowerCase();
    const filtered = allNotes.filter(note =>
        note.name.toLowerCase().includes(query) ||
        note.code.toLowerCase().includes(query)
    );
    renderNotes(filtered);
}

function renderFileDisplay(note) {
    if (!note.image_data) return '';

    // Check if it's an image
    if (note.file_type && note.file_type.startsWith('image/')) {
        return `<div class="note-image"><img src="${note.image_data}" alt="Note Image"></div>`;
    }

    // Fallback for old images without file_type
    if (!note.file_type && note.image_data.startsWith('data:image')) {
        return `<div class="note-image"><img src="${note.image_data}" alt="Note Image"></div>`;
    }

    // For other files
    const fileName = note.file_name || 'Attached File';
    // Logic for file type display
    return `<div class="file-attachment">
        <span class="file-icon">📄</span>
        <div class="file-info">
            <span class="file-name">${fileName}</span>
            <span class="file-type">${note.file_type || 'Unknown'}</span>
        </div>
    </div>`;
}


function toggleCode(id) {
    const codeBlock = document.getElementById(`code-${id}`);
    if (codeBlock.style.display === 'block') {
        codeBlock.style.display = 'none';
    } else {
        codeBlock.style.display = 'block';
    }
}

function copyToClipboard(id) {
    const codeBlock = document.querySelector(`#code-${id} pre code`);
    if (codeBlock) {
        const text = codeBlock.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('Code copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy code.');
        });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

async function saveNote() {
    const id = document.getElementById('noteId').value;
    const name = document.getElementById('noteName').value;
    const code = document.getElementById('noteCode').value;

    if (!name || !code) {
        alert('Please enter both name and code.');
        return;
    }

    const payload = {
        name,
        code,
        image: currentFile,
        fileType: currentFileType,
        fileName: currentFileName
    };
    if (id) {
        payload.id = id;
    }

    const endpoint = id ? '/update' : '/save';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(id ? 'Note updated successfully!' : 'Note saved successfully!');
            clearForm();
            loadNotes();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error saving note:', error);
    }
}

async function editNote(id) {
    try {
        const response = await fetch(`${API_URL}/note/${id}`);
        const note = await response.json();

        document.getElementById('noteId').value = note.id;
        document.getElementById('noteName').value = note.name;
        document.getElementById('noteCode').value = note.code;

        currentFile = note.image_data || null;
        currentFileType = note.file_type || null;
        currentFileName = note.file_name || null;

        if (currentFile) {
            updatePreview(currentFile, currentFileType, currentFileName);
            document.getElementById('filePreviewContainer').style.display = 'block';
        } else {
            document.getElementById('filePreviewContainer').style.display = 'none';
        }

        // Scroll to editor
        document.querySelector('.editor-section').scrollIntoView({ behavior: 'smooth' });

        // Change button text contextually if needed, but "Save Note" works for both
        document.getElementById('saveBtn').innerText = 'Update Note';
    } catch (error) {
        console.error('Error fetching note details:', error);
    }
}

async function deleteNote(id) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        const response = await fetch(`${API_URL}/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });

        if (response.ok) {
            loadNotes();
        } else {
            alert('Error deleting note');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

function clearForm() {
    document.getElementById('noteId').value = '';
    document.getElementById('noteName').value = '';
    document.getElementById('noteCode').value = '';
    removeFile();
    document.getElementById('saveBtn').innerText = 'Save Note';
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        e.target.value = '';
        return;
    }

    currentFileType = file.type;
    currentFileName = file.name;

    const reader = new FileReader();
    reader.onload = function (event) {
        currentFile = event.target.result;
        updatePreview(currentFile, currentFileType, currentFileName);
        document.getElementById('filePreviewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function updatePreview(data, type, name) {
    const displayArea = document.getElementById('fileDisplayArea');

    if (type && type.startsWith('image/')) {
        displayArea.innerHTML = `<img id="imagePreview" src="${data}" alt="Preview">`;
    } else if (!type && data.startsWith('data:image')) {
        // Fallback for old images
        displayArea.innerHTML = `<img id="imagePreview" src="${data}" alt="Preview">`;
    } else {
        displayArea.innerHTML = `
            <div class="file-preview-box">
                <span class="file-icon">📄</span>
                <span class="file-name">${name || 'Selected File'}</span>
            </div>
        `;
    }
}

function removeFile() {
    currentFile = null;
    currentFileType = null;
    currentFileName = null;
    document.getElementById('noteFile').value = '';
    document.getElementById('fileDisplayArea').innerHTML = '';
    document.getElementById('filePreviewContainer').style.display = 'none';
}

function downloadFile(id) {
    const note = allNotes.find(n => n.id == id);
    if (note && note.image_data) {
        const link = document.createElement('a');
        link.href = note.image_data;

        let filename = 'download';
        if (note.file_name) {
            filename = note.file_name;
        } else if (note.name) {
            const safeName = note.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            // Guess extension if possible, default to png for backward compatibility
            const ext = note.file_type ? (note.file_type.split('/')[1] || 'png') : 'png';
            filename = `${safeName}.${ext}`;
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
