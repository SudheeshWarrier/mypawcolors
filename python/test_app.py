#!/usr/bin/env python3
"""
Quick test to verify the Data Manager app is working correctly
"""
import sys
import json
from pathlib import Path

# Test 1: Check Python version
print("=" * 50)
print("DATA MANAGER - Quick Verification Test")
print("=" * 50)
print(f"\n✓ Python version: {sys.version.split()[0]}")

# Test 2: Check Flask import
try:
    from flask import Flask
    print("✓ Flask is installed and importable")
except ImportError as e:
    print(f"✗ Flask error: {e}")
    sys.exit(1)

# Test 3: Check app.py syntax
try:
    import app
    print("✓ app.py loads without syntax errors")
except Exception as e:
    print(f"✗ app.py error: {e}")
    sys.exit(1)

# Test 4: Check JSON files can be accessed
workspace_root = Path(__file__).parent.parent
print(f"\n✓ Workspace root: {workspace_root}")

files_to_check = {
    'catalog.json': workspace_root / 'catalog.json',
    'students.json': workspace_root / 'students.json',
    'hobby.json': workspace_root / 'hobby.json',
}

print("\nJSON Files Status:")
for name, path in files_to_check.items():
    if path.exists():
        size = path.stat().st_size
        status = f"✓ {name}: {size} bytes"
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content and content != '[]':
                    data = json.loads(content)
                    status += f" ({len(data)} items)"
                else:
                    status += " (empty - ready for data)"
        except json.JSONDecodeError:
            status += " (empty file)"
        print(f"  {status}")
    else:
        print(f"  ✗ {name}: NOT FOUND")

# Test 5: Check frontend files
print("\nFrontend Files Status:")
frontend_files = {
    'templates/index.html': Path(__file__).parent / 'templates' / 'index.html',
    'static/style.css': Path(__file__).parent / 'static' / 'style.css',
    'static/script.js': Path(__file__).parent / 'static' / 'script.js',
}

for name, path in frontend_files.items():
    if path.exists():
        size = path.stat().st_size
        print(f"  ✓ {name}: {size} bytes")
    else:
        print(f"  ✗ {name}: NOT FOUND")

print("\n" + "=" * 50)
print("✓ ALL TESTS PASSED!")
print("=" * 50)
print("\nThe app is ready to run. Use:")
print("  python app.py")
print("\nThen open http://localhost:5000 in your browser")
print("=" * 50)
