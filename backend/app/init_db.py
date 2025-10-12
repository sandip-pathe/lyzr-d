# app/init_db.py
from app.core.database import engine, Base
from app.models.workflow import Workflow, Execution, ApprovalRequest

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")

if __name__ == "__main__":
    init_db()
