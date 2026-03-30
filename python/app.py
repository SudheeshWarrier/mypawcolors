from flask import Flask, render_template, request, jsonify
import json
import os
from pathlib import Path

app = Flask(__name__, template_folder='templates', static_folder='static')

# Get the parent directory (workspace root)
WORKSPACE_ROOT = Path(__file__).parent.parent

# File paths
CATALOG_FILE = WORKSPACE_ROOT / 'catalog.json'
STUDENTS_FILE = WORKSPACE_ROOT / 'students.json'
HOBBY_FILE = WORKSPACE_ROOT / 'hobby.json'


def load_json(filepath):
    """Load JSON file, return empty list if file is empty or doesn't exist"""
    try:
        if filepath.exists():
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    return json.loads(content)
        return []
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return []


def save_json(filepath, data):
    """Save data to JSON file"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        return False


def get_next_id(data):
    """Get the next available ID"""
    if not data:
        return 1
    return max(item.get('id', 0) for item in data) + 1


@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')


# ============== CATALOG ENDPOINTS ==============
@app.route('/api/catalog', methods=['GET'])
def get_catalog():
    """Get all catalog items"""
    data = load_json(CATALOG_FILE)
    return jsonify(data)


@app.route('/api/catalog', methods=['POST'])
def add_catalog_item():
    """Add new catalog item"""
    data = load_json(CATALOG_FILE)
    new_item = request.json
    new_item['id'] = get_next_id(data)
    data.append(new_item)
    if save_json(CATALOG_FILE, data):
        return jsonify(new_item), 201
    return jsonify({'error': 'Failed to save'}), 500


@app.route('/api/catalog/<int:item_id>', methods=['PUT'])
def update_catalog_item(item_id):
    """Update catalog item"""
    data = load_json(CATALOG_FILE)
    for i, item in enumerate(data):
        if item.get('id') == item_id:
            updated_data = request.json
            # If ID is being changed, update the ID
            if 'id' in updated_data:
                item['id'] = updated_data['id']
            item.update(updated_data)
            if save_json(CATALOG_FILE, data):
                return jsonify(item)
            return jsonify({'error': 'Failed to save'}), 500
    return jsonify({'error': 'Item not found'}), 404


@app.route('/api/catalog/<int:item_id>', methods=['DELETE'])
def delete_catalog_item(item_id):
    """Delete catalog item"""
    data = load_json(CATALOG_FILE)
    data = [item for item in data if item.get('id') != item_id]
    if save_json(CATALOG_FILE, data):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to delete'}), 500


# ============== STUDENTS ENDPOINTS ==============
@app.route('/api/students', methods=['GET'])
def get_students():
    """Get all students"""
    data = load_json(STUDENTS_FILE)
    return jsonify(data)


@app.route('/api/students', methods=['POST'])
def add_student():
    """Add new student"""
    data = load_json(STUDENTS_FILE)
    new_item = request.json
    new_item['id'] = get_next_id(data)
    data.append(new_item)
    if save_json(STUDENTS_FILE, data):
        return jsonify(new_item), 201
    return jsonify({'error': 'Failed to save'}), 500


@app.route('/api/students/<int:item_id>', methods=['PUT'])
def update_student(item_id):
    """Update student"""
    data = load_json(STUDENTS_FILE)
    for item in data:
        if item.get('id') == item_id:
            updated_data = request.json
            item.update(updated_data)
            if save_json(STUDENTS_FILE, data):
                return jsonify(item)
            return jsonify({'error': 'Failed to save'}), 500
    return jsonify({'error': 'Item not found'}), 404


@app.route('/api/students/<int:item_id>', methods=['DELETE'])
def delete_student(item_id):
    """Delete student"""
    data = load_json(STUDENTS_FILE)
    data = [item for item in data if item.get('id') != item_id]
    if save_json(STUDENTS_FILE, data):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to delete'}), 500


# ============== HOBBY ENDPOINTS ==============
@app.route('/api/hobby', methods=['GET'])
def get_hobby():
    """Get all hobbies"""
    data = load_json(HOBBY_FILE)
    return jsonify(data)


@app.route('/api/hobby', methods=['POST'])
def add_hobby():
    """Add new hobby"""
    data = load_json(HOBBY_FILE)
    new_item = request.json
    new_item['id'] = get_next_id(data)
    data.append(new_item)
    if save_json(HOBBY_FILE, data):
        return jsonify(new_item), 201
    return jsonify({'error': 'Failed to save'}), 500


@app.route('/api/hobby/<int:item_id>', methods=['PUT'])
def update_hobby(item_id):
    """Update hobby"""
    data = load_json(HOBBY_FILE)
    for item in data:
        if item.get('id') == item_id:
            updated_data = request.json
            item.update(updated_data)
            if save_json(HOBBY_FILE, data):
                return jsonify(item)
            return jsonify({'error': 'Failed to save'}), 500
    return jsonify({'error': 'Item not found'}), 404


@app.route('/api/hobby/<int:item_id>', methods=['DELETE'])
def delete_hobby(item_id):
    """Delete hobby"""
    data = load_json(HOBBY_FILE)
    data = [item for item in data if item.get('id') != item_id]
    if save_json(HOBBY_FILE, data):
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to delete'}), 500


if __name__ == '__main__':
    # Run with use_reloader=False to avoid watchdog compatibility issues
    app.run(debug=False, port=5000, host='localhost', use_reloader=False)
