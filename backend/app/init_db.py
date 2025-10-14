from app.core.database import engine, Base
from app.models.workflow import Workflow, Execution, ApprovalRequest
from app.models.event_log import EventLog, CompensationLog, AgentScore

def init_db():
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")

if __name__ == "__main__":
    init_db()