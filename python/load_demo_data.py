#!/usr/bin/env python3
"""
Demo data loader - populates the JSON files with sample data for demonstration
Run this to see how the app works with sample data
"""

import json
from pathlib import Path

workspace_root = Path(__file__).parent.parent

# Sample catalog data
sample_catalog = [
    {
        "id": 1,
        "title": "Sunset Over Mountains",
        "artist": "My Paw Colors Studio",
        "category": "Landscapes",
        "image": "",
        "price": "$75",
        "status": "available",
        "specifications": {
            "medium": "Acrylic on canvas",
            "size": "12 x 16 inches",
            "year": "2024",
            "frame": "Wooden frame included"
        },
        "hero": True
    },
    {
        "id": 2,
        "title": "Pet Portrait - Golden Retriever",
        "artist": "My Paw Colors Studio",
        "category": "Pet Portraits",
        "image": "",
        "price": "$50",
        "status": "available",
        "specifications": {
            "medium": "Soft pastels on paper",
            "size": "8 x 10 inches",
            "year": "2024",
            "frame": "Unframed"
        },
        "hero": False
    }
]

# Sample students data
sample_students = [
    {
        "id": 1,
        "firstName": "Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@email.com",
        "phone": "555-0101",
        "status": "active",
        "enrollmentDate": "2024-01-15"
    },
    {
        "id": 2,
        "firstName": "Michael",
        "lastName": "Chen",
        "email": "m.chen@email.com",
        "phone": "555-0102",
        "status": "active",
        "enrollmentDate": "2024-02-20"
    }
]

# Sample hobbies data
sample_hobbies = [
    {
        "id": 1,
        "name": "Watercolor Painting",
        "category": "Art",
        "description": "Creating beautiful watercolor artworks",
        "level": "intermediate",
        "frequency": "weekly",
        "cost": 15.00
    },
    {
        "id": 2,
        "name": "Digital Photography",
        "category": "Photography",
        "description": "Professional digital photography and editing",
        "level": "advanced",
        "frequency": "weekly",
        "cost": 25.00
    }
]

def load_demo_data():
    """Load demo data into JSON files"""
    try:
        # Save catalog
        catalog_file = workspace_root / 'catalog.json'
        with open(catalog_file, 'w', encoding='utf-8') as f:
            json.dump(sample_catalog, f, indent=2, ensure_ascii=False)
        print(f"✓ Loaded {len(sample_catalog)} sample catalog items")
        
        # Save students
        students_file = workspace_root / 'students.json'
        with open(students_file, 'w', encoding='utf-8') as f:
            json.dump(sample_students, f, indent=2, ensure_ascii=False)
        print(f"✓ Loaded {len(sample_students)} sample students")
        
        # Save hobbies
        hobby_file = workspace_root / 'hobby.json'
        with open(hobby_file, 'w', encoding='utf-8') as f:
            json.dump(sample_hobbies, f, indent=2, ensure_ascii=False)
        print(f"✓ Loaded {len(sample_hobbies)} sample hobbies")
        
        print("\n✓ Demo data loaded successfully!")
        print("Run 'python app.py' to see the data in action")
        return True
    except Exception as e:
        print(f"✗ Error loading demo data: {e}")
        return False

if __name__ == '__main__':
    print("=" * 50)
    print("Data Manager - Demo Data Loader")
    print("=" * 50)
    print()
    load_demo_data()
