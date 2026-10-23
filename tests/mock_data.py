"""
Artius Lab - Centralized Test Mock Data
=======================================
Shared realistic dataset for both HTML and LaTeX template testing.
Supports:
  - with_pic: complete resume data with photo data URI
  - no_pic: complete resume data with photo = None
  - minimal_pic: minimal/sparse resume data with photo
  - minimal_nopic: minimal/sparse resume data without photo
  - special_chars: data containing LaTeX/HTML special characters for escaping tests
"""

import copy
from typing import Dict, Any

# 1x1 Transparent PNG (Data URI) for offline testing
SAMPLE_PHOTO_BASE64 = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)

MOCK_RESUME_DATA: Dict[str, Any] = {
    "personal_info": {
        "full_name": "Jonathan D. Smith",
        "title": "Senior Software Architect",
        "email": "jsmith.dev@example.com",
        "phone": "+1 (555) 012-3456",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/johnsmith-dev",
        "portfolio": "www.johnsmith.dev",
        "website": "www.johnsmith.dev",
        "twitter": "@johnsmith_dev",
        "summary": "Senior Software Architect with 8+ years of experience leading cross-functional teams and designing distributed cloud microservices. Expert in Python, React, and Kubernetes.",
        "photo": SAMPLE_PHOTO_BASE64,
        "photo_url": SAMPLE_PHOTO_BASE64,
    },
    "education": [
        {
            "degree": "MS in Artificial Intelligence",
            "field_of_study": "Computer Science & ML",
            "institution": "Stanford University",
            "start_date": "2014",
            "end_date": "2016",
            "location": "Stanford, CA",
            "gpa": "3.92",
            "achievements": "Top 5% of class. Summa Cum Laude.",
            "description": "Thesis on High-Performance Distributed Object Detection Pipelines."
        },
        {
            "degree": "BS in Computer Engineering",
            "field_of_study": "Electrical Engineering & CS",
            "institution": "University of California, Berkeley",
            "start_date": "2010",
            "end_date": "2014",
            "location": "Berkeley, CA",
            "gpa": "3.85",
            "achievements": "Dean's Honors List.",
            "description": "Focus on embedded systems and operating systems."
        }
    ],
    "experience": [
        {
            "company": "Innovation Labs AI",
            "location": "San Francisco, CA",
            "title": "Lead Software Architect",
            "start_date": "Aug 2020",
            "end_date": "Present",
            "description": "Spearheaded core cloud architecture supporting 12M+ monthly active users.",
            "highlights": [
                "Led distributed microservices migration using Go and Kubernetes with 99.99% uptime.",
                "Reduced AWS monthly infrastructure spend by 35% through event-driven serverless autoscaling.",
                "Mentored a team of 14 senior and staff engineers across 3 time zones."
            ]
        },
        {
            "company": "Global Connect Corp",
            "location": "Palo Alto, CA",
            "title": "Senior Full-Stack Engineer",
            "start_date": "Jun 2016",
            "end_date": "Jul 2020",
            "description": "Architected high-throughput fintech services and secure payment processing gateways.",
            "highlights": [
                "Built customer-facing React & TypeScript web app handling $50M+ annual transaction volume.",
                "Optimized state management and database query pipelines, reducing p99 latency by 45%."
            ]
        }
    ],
    "skills": [
        {"name": "Python", "level": "Expert"},
        {"name": "React / Next.js", "level": "Advanced"},
        {"name": "TypeScript", "level": "Advanced"},
        {"name": "Docker & K8s", "level": "Expert"},
        {"name": "AWS Cloud", "level": "Intermediate"},
        {"name": "System Architecture", "level": "Expert"}
    ],
    "projects": [
        {
            "name": "Archi-Viz Real Estate Platform",
            "link": "https://archi-viz.demo",
            "description": "Interactive real-time 3D walkthroughs with automated AI floor-plan generation.",
            "technologies": ["Python", "FastAPI", "React", "Three.js", "Docker"],
            "start_date": "Jan 2023",
            "end_date": "Oct 2023"
        },
        {
            "name": "Cloud Observability Dashboard",
            "link": "https://github.com/example/observability",
            "description": "Lightweight distributed tracing and metric aggregation engine for container clusters.",
            "technologies": ["Go", "Prometheus", "Grafana", "Kubernetes"],
            "start_date": "Mar 2022",
            "end_date": "Dec 2022"
        }
    ],
    "expertise": {
        "technical": ["System Design", "Cloud Architecture", "Distributed Systems", "API Design", "Database Optimization"],
        "professional": ["Engineering Leadership", "Agile Roadmap Execution", "Mentorship", "Stakeholder Communication"],
        "software_and_other": ["Docker", "Kubernetes", "Git", "GitHub Actions", "Terraform", "PostgreSQL"],
        "labels": ["Technical", "Professional"]
    },
    "certifications": [
        {
            "name": "AWS Certified Solutions Architect - Professional",
            "issuer": "Amazon Web Services",
            "year": "2023",
            "date": "Oct 2023"
        },
        {
            "name": "Certified Kubernetes Administrator (CKA)",
            "issuer": "Cloud Native Computing Foundation",
            "year": "2022",
            "date": "Jun 2022"
        }
    ],
    "languages": [
        {"name": "English", "proficiency": "Native"},
        {"name": "Spanish", "proficiency": "Fluent"},
        {"name": "German", "proficiency": "Conversational"}
    ],
    "hobbies": [
        "Landscape Photography",
        "Alpine Mountaineering",
        "Open-Source Contributing",
        "Algorithmic Chess"
    ],
    "awards": [
        {
            "title": "Engineer of the Year",
            "issuer": "Innovation Labs AI",
            "year": "2023"
        }
    ]
}


def build_payload(mode: str = "with_pic") -> Dict[str, Any]:
    """
    Generate mock payload for the specified test mode:
      'with_pic'      : Complete resume with photo data
      'no_pic'        : Complete resume WITHOUT photo (photo is None)
      'minimal_pic'   : Minimal resume (empty lists) with photo
      'minimal_nopic' : Minimal resume (empty lists) without photo
      'special_chars' : Resume with LaTeX/HTML special characters to verify escaping
    """
    if mode == "with_pic":
        data = copy.deepcopy(MOCK_RESUME_DATA)
        data["personal_info"]["photo"] = SAMPLE_PHOTO_BASE64
        data["personal_info"]["photo_url"] = SAMPLE_PHOTO_BASE64
        has_photo = True

    elif mode == "no_pic":
        data = copy.deepcopy(MOCK_RESUME_DATA)
        data["personal_info"]["photo"] = None
        data["personal_info"]["photo_url"] = None
        has_photo = False

    elif mode == "minimal_pic":
        data = {
            "personal_info": {
                "full_name": "Jane Doe",
                "email": "jane@example.com",
                "phone": "+1 555-0100",
                "location": "Boston, MA",
                "photo": SAMPLE_PHOTO_BASE64,
                "photo_url": SAMPLE_PHOTO_BASE64,
            },
            "education": [],
            "experience": [],
            "skills": [],
            "projects": [],
            "expertise": {},
            "certifications": [],
            "languages": [],
            "hobbies": [],
            "awards": []
        }
        has_photo = True

    elif mode == "minimal_nopic":
        data = {
            "personal_info": {
                "full_name": "Jane Doe",
                "email": "jane@example.com",
                "phone": "+1 555-0100",
                "location": "Boston, MA",
                "photo": None,
                "photo_url": None,
            },
            "education": [],
            "experience": [],
            "skills": [],
            "projects": [],
            "expertise": {},
            "certifications": [],
            "languages": [],
            "hobbies": [],
            "awards": []
        }
        has_photo = False

    elif mode == "special_chars":
        data = copy.deepcopy(MOCK_RESUME_DATA)
        data["personal_info"]["full_name"] = "Alice & Bob (Tech_Lead) 100% #1"
        data["personal_info"]["summary"] = "Experienced with C++, R&D, $1M+ budgets, ~50% growth, and {JSON} data."
        has_photo = True

    else:
        raise ValueError(f"Unknown mock mode: {mode}")

    return {
        "personal": data["personal_info"],
        "personal_info": data["personal_info"],
        "education": data.get("education", []),
        "experience": data.get("experience", []),
        "skills": data.get("skills", []),
        "projects": data.get("projects", []),
        "expertise": data.get("expertise", {}),
        "certifications": data.get("certifications", []),
        "languages": data.get("languages", []),
        "hobbies": data.get("hobbies", []),
        "awards": data.get("awards", []),
        "has_photo": has_photo,
        "photo_data": data["personal_info"].get("photo")
    }
