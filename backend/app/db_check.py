"""
Database Health Check and Initialization Script
Run this before deployment to ensure database is ready
"""
import sys
from sqlalchemy import text, inspect
from sqlalchemy.exc import OperationalError
from app.core.database import engine, SessionLocal, Base
from app.models.workflow import Workflow, Execution, ApprovalRequest
from app.models.event_log import EventLog, CompensationLog, AgentScore

def check_connection():
    """Test database connection"""
    print("🔍 Checking database connection...")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        return True
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_tables():
    """Check if all required tables exist"""
    print("🔍 Checking database tables...")
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    
    required_tables = {
        'workflows',
        'executions', 
        'approval_requests',
        'event_logs',
        'compensation_logs',
        'agent_scores'
    }
    
    missing_tables = required_tables - existing_tables
    
    if missing_tables:
        print(f"⚠️  Missing tables: {', '.join(missing_tables)}")
        return False
    
    print(f"✅ All required tables exist ({len(existing_tables)} tables)")
    return True

def init_tables():
    """Create all tables"""
    print("🔨 Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False

def verify_table_schemas():
    """Verify table schemas have required columns"""
    print("🔍 Verifying table schemas...")
    inspector = inspect(engine)
    
    checks = {
        'workflows': ['id', 'name', 'definition', 'created_at'],
        'executions': ['id', 'workflow_id', 'status', 'input_data'],
        'approval_requests': ['id', 'execution_id', 'node_id', 'status'],
    }
    
    all_good = True
    for table, required_cols in checks.items():
        try:
            columns = [col['name'] for col in inspector.get_columns(table)]
            missing = set(required_cols) - set(columns)
            if missing:
                print(f"❌ Table '{table}' missing columns: {', '.join(missing)}")
                all_good = False
            else:
                print(f"✅ Table '{table}' schema valid")
        except Exception as e:
            print(f"❌ Failed to check table '{table}': {e}")
            all_good = False
    
    return all_good

def test_crud_operations():
    """Test basic CRUD operations"""
    print("🔍 Testing CRUD operations...")
    db = SessionLocal()
    try:
        # Test insert
        test_workflow = Workflow(
            id="health-check-test",
            name="Health Check Workflow",
            description="Test workflow for health check",
            definition={"nodes": [], "edges": []}
        )
        db.add(test_workflow)
        db.commit()
        print("✅ INSERT operation works")
        
        # Test select
        result = db.query(Workflow).filter(Workflow.id == "health-check-test").first()
        if result:
            print("✅ SELECT operation works")
        
        # Test delete
        db.delete(result)
        db.commit()
        print("✅ DELETE operation works")
        
        return True
    except Exception as e:
        print(f"❌ CRUD operations failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Run all health checks"""
    print("=" * 60)
    print("🏥 DATABASE HEALTH CHECK & INITIALIZATION")
    print("=" * 60)
    print()
    
    # Check connection
    if not check_connection():
        print("\n❌ Cannot connect to database")
        sys.exit(1)
    
    # Check if tables exist
    if not check_tables():
        print("\n🔨 Attempting to create tables...")
        if not init_tables():
            print("\n❌ Failed to initialize database")
            sys.exit(1)
    
    # Verify schemas
    if not verify_table_schemas():
        print("\n❌ Schema verification failed")
        sys.exit(1)
    
    # Test operations
    if not test_crud_operations():
        print("\n❌ CRUD operations test failed")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ ALL HEALTH CHECKS PASSED")
    print("=" * 60)
    print("\n🚀 Database is ready for deployment!")
    sys.exit(0)

if __name__ == "__main__":
    main()
