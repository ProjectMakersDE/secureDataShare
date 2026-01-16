import os
import re
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration from environment variables
PORT = int(os.environ.get('PORT', 8101))
MAX_FILE_SIZE_MB = int(os.environ.get('MAX_FILE_SIZE_MB', 50))
MAX_FILES = int(os.environ.get('MAX_FILES', 10))
MAX_TEXT_LENGTH = int(os.environ.get('MAX_TEXT_LENGTH', 4096))
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/uploads')

app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE_MB * 1024 * 1024 * MAX_FILES


def sanitize_name(name):
    """Sanitize folder name: only allow alphanumeric and hyphens."""
    sanitized = re.sub(r'[^a-zA-Z0-9\-]', '-', name.strip())
    sanitized = re.sub(r'-+', '-', sanitized)
    sanitized = sanitized.strip('-')
    return sanitized[:100] if sanitized else 'unnamed'


@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html',
                         max_file_size_mb=MAX_FILE_SIZE_MB,
                         max_files=MAX_FILES,
                         max_text_length=MAX_TEXT_LENGTH)


@app.route('/upload', methods=['POST'])
def upload():
    """Handle file and text uploads."""
    name = request.form.get('name', '').strip()
    text = request.form.get('text', '').strip()
    files = request.files.getlist('files')

    # Validate name
    if not name:
        return jsonify({'success': False, 'error': 'Name ist erforderlich'}), 400

    # Validate text length
    if len(text) > MAX_TEXT_LENGTH:
        return jsonify({'success': False, 'error': f'Text darf maximal {MAX_TEXT_LENGTH} Zeichen haben'}), 400

    # Validate file count
    actual_files = [f for f in files if f.filename]
    if len(actual_files) > MAX_FILES:
        return jsonify({'success': False, 'error': f'Maximal {MAX_FILES} Dateien erlaubt'}), 400

    # Check if there's anything to upload
    if not actual_files and not text:
        return jsonify({'success': False, 'error': 'Mindestens eine Datei oder Text erforderlich'}), 400

    # Create folder with sanitized name
    folder_name = sanitize_name(name)
    folder_path = os.path.join(UPLOAD_FOLDER, folder_name)

    # If folder exists, append number
    original_path = folder_path
    counter = 1
    while os.path.exists(folder_path):
        folder_path = f"{original_path}_{counter}"
        counter += 1

    os.makedirs(folder_path, exist_ok=True)

    saved_files = []

    # Save files
    for file in actual_files:
        if file.filename:
            filename = secure_filename(file.filename)
            if filename:
                file_path = os.path.join(folder_path, filename)
                # Handle duplicate filenames
                base, ext = os.path.splitext(filename)
                file_counter = 1
                while os.path.exists(file_path):
                    filename = f"{base}_{file_counter}{ext}"
                    file_path = os.path.join(folder_path, filename)
                    file_counter += 1
                file.save(file_path)
                saved_files.append(filename)

    # Save text as message.txt
    if text:
        text_path = os.path.join(folder_path, 'message.txt')
        with open(text_path, 'w', encoding='utf-8') as f:
            f.write(text)
        saved_files.append('message.txt')

    return jsonify({
        'success': True,
        'message': f'Erfolgreich hochgeladen: {len(saved_files)} Datei(en)',
        'folder': os.path.basename(folder_path)
    })


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error."""
    return jsonify({
        'success': False,
        'error': f'Datei zu gross. Maximum: {MAX_FILE_SIZE_MB} MB pro Datei'
    }), 413


if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(host='0.0.0.0', port=PORT, debug=False)
