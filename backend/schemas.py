from pydantic import BaseModel, EmailStr
from typing import Optional


class PersonalInfo(BaseModel):
    full_name: str
    email: str
    phone: str
    location: str
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    summary: Optional[str] = None


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: str
    end_date: Optional[str] = "Present"
    gpa: Optional[str] = None
    achievements: Optional[str] = None


class Experience(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: Optional[str] = "Present"
    description: str
    highlights: Optional[list[str]] = []


class Skill(BaseModel):
    name: str
    level: Optional[str] = "Intermediate"  # Beginner, Intermediate, Advanced, Expert


class Project(BaseModel):
    name: str
    description: str
    technologies: Optional[list[str]] = []
    link: Optional[str] = None


class ResumeData(BaseModel):
    template_id: str
    personal_info: PersonalInfo
    education: list[Education] = []
    experience: list[Experience] = []
    skills: list[Skill] = []
    projects: list[Project] = []


class EnhancedResumeData(BaseModel):
    personal_info: PersonalInfo
    education: list[Education] = []
    experience: list[Experience] = []
    skills: list[Skill] = []
    projects: list[Project] = []


class HTMLData(BaseModel):
    html: str
    filename: Optional[str] = "Resume.pdf"
