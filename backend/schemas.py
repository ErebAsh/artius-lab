from pydantic import BaseModel


class PersonalInfo(BaseModel):
    full_name: str
    title: str | None = None
    email: str
    phone: str
    location: str
    linkedin: str | None = None
    portfolio: str | None = None
    summary: str | None = None
    photo: str | None = None


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str
    start_date: str
    end_date: str | None = "Present"
    gpa: str | None = None
    achievements: str | None = None


class Experience(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: str | None = "Present"
    description: str
    highlights: list[str] | None = []


class Skill(BaseModel):
    name: str
    level: str | None = "Intermediate"  # Beginner, Intermediate, Advanced, Expert


class Certification(BaseModel):
    name: str
    issuer: str
    year: str | None = None
    date: str | None = None


class Language(BaseModel):
    name: str
    proficiency: str | None = "Fluent"  # Native, Fluent, Conversational, Basic


class Project(BaseModel):
    name: str
    description: str
    technologies: list[str] | None = []
    link: str | None = None


class Expertise(BaseModel):
    technical: list[str] = []
    professional: list[str] = []


class ResumeData(BaseModel):
    template_id: str
    personal_info: PersonalInfo
    education: list[Education] = []
    experience: list[Experience] = []
    skills: list[Skill] = []
    projects: list[Project] = []
    certifications: list[Certification] = []
    languages: list[Language] = []
    expertise: Expertise | None = None
    hobbies: list[str] = []


class EnhancedResumeData(BaseModel):
    personal_info: PersonalInfo
    education: list[Education] = []
    experience: list[Experience] = []
    skills: list[Skill] = []
    projects: list[Project] = []
    certifications: list[Certification] = []
    languages: list[Language] = []
    expertise: Expertise | None = None
    hobbies: list[str] = []


class HTMLData(BaseModel):
    html: str
    filename: str | None = "Resume.pdf"


# ── Auth Schemas ──────────────────────────────────────────────────


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str | None = ""
    gemini_api_key: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str
