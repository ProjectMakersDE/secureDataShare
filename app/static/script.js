document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('files');
    const dropZone = document.getElementById('dropZone');
    const fileList = document.getElementById('fileList');
    const textArea = document.getElementById('text');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const statusMessage = document.getElementById('statusMessage');

    let selectedFiles = new DataTransfer();

    // Character counter for textarea
    textArea.addEventListener('input', function() {
        charCount.textContent = this.value.length;
        if (this.value.length > MAX_TEXT_LENGTH * 0.9) {
            charCount.classList.add('text-yellow-400');
        } else {
            charCount.classList.remove('text-yellow-400');
        }
    });

    // Click on drop zone opens file dialog
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    // Drag and drop events
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // File input change
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        const currentCount = selectedFiles.files.length;
        const newFiles = Array.from(files);

        if (currentCount + newFiles.length > MAX_FILES) {
            showStatus(`Maximum ${MAX_FILES} files allowed`, 'error');
            return;
        }

        newFiles.forEach(file => {
            selectedFiles.items.add(file);
        });

        updateFileList();
    }

    function updateFileList() {
        fileList.innerHTML = '';

        Array.from(selectedFiles.files).forEach((file, index) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.innerHTML = `
                <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                <div class="flex items-center gap-3">
                    <span class="file-size">${formatFileSize(file.size)}</span>
                    <span class="remove-btn" data-index="${index}" title="Remove">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </span>
                </div>
            `;
            fileList.appendChild(div);
        });

        // Add remove handlers
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                removeFile(parseInt(this.dataset.index));
            });
        });
    }

    function removeFile(index) {
        const newTransfer = new DataTransfer();
        Array.from(selectedFiles.files).forEach((file, i) => {
            if (i !== index) {
                newTransfer.items.add(file);
            }
        });
        selectedFiles = newTransfer;
        updateFileList();
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showStatus(message, type) {
        statusMessage.className = type === 'success' ? 'status-success mt-6' : 'status-error mt-6';
        statusMessage.textContent = message;
        statusMessage.classList.remove('hidden');

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 5000);
        }
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        btnText.classList.toggle('hidden', loading);
        btnSpinner.classList.toggle('hidden', !loading);
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const text = textArea.value.trim();

        // Validation
        if (!name) {
            showStatus('Please enter a name', 'error');
            return;
        }

        if (selectedFiles.files.length === 0 && !text) {
            showStatus('Please provide at least a file or a message', 'error');
            return;
        }

        setLoading(true);
        statusMessage.classList.add('hidden');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('text', text);

        Array.from(selectedFiles.files).forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showStatus(result.message, 'success');
                // Reset form
                form.reset();
                selectedFiles = new DataTransfer();
                updateFileList();
                charCount.textContent = '0';
            } else {
                showStatus(result.error || 'An error occurred', 'error');
            }
        } catch (error) {
            showStatus('Connection error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    });
});
