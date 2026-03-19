RESUME_TEMPLATES = []


def get_template_by_id(template_id: str):
    for t in RESUME_TEMPLATES:
        if t["id"] == template_id:
            return t
    return None
