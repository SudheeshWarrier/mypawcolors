#!/usr/bin/env python3
"""
Data Export Utility - Export JSON data to CSV for business users
"""

import json
import csv
from pathlib import Path
from datetime import datetime

workspace_root = Path(__file__).parent.parent

def export_catalog_to_csv():
    """Export catalog data to CSV"""
    try:
        catalog_file = workspace_root / 'catalog.json'
        with open(catalog_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("✓ Catalog is empty - no data to export")
            return
            
        csv_file = workspace_root / 'catalog_export.csv'
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            if data:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
                print(f"✓ Exported {len(data)} catalog items to catalog_export.csv")
    except Exception as e:
        print(f"✗ Error exporting catalog: {e}")

def export_students_to_csv():
    """Export students data to CSV"""
    try:
        students_file = workspace_root / 'students.json'
        with open(students_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("✓ Students list is empty - no data to export")
            return
            
        csv_file = workspace_root / 'students_export.csv'
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            if data:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
                print(f"✓ Exported {len(data)} students to students_export.csv")
    except Exception as e:
        print(f"✗ Error exporting students: {e}")

def export_hobbies_to_csv():
    """Export hobbies data to CSV"""
    try:
        hobby_file = workspace_root / 'hobby.json'
        with open(hobby_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not data:
            print("✓ Hobbies list is empty - no data to export")
            return
            
        csv_file = workspace_root / 'hobbies_export.csv'
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            if data:
                writer = csv.DictWriter(f, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
                print(f"✓ Exported {len(data)} hobbies to hobbies_export.csv")
    except Exception as e:
        print(f"✗ Error exporting hobbies: {e}")

if __name__ == '__main__':
    print("=" * 50)
    print("Data Manager - Export to CSV")
    print("=" * 50)
    print()
    export_catalog_to_csv()
    export_students_to_csv()
    export_hobbies_to_csv()
    print()
    print("✓ Export complete!")
    print("CSV files created in workspace folder")
    print("=" * 50)
