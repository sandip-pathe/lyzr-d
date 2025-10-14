"""Node type registry API"""
from fastapi import APIRouter
from typing import List, Dict, Any
from app.schemas.node_types import get_all_node_types, get_node_type_info, NodeType

router = APIRouter(prefix="/node-types", tags=["node-types"])

@router.get("/", response_model=List[Dict[str, Any]])
async def list_node_types():
    """Get all available node types with their schemas"""
    return get_all_node_types()

@router.get("/{node_type}", response_model=Dict[str, Any])
async def get_node_type(node_type: str):
    """Get specific node type schema"""
    return get_node_type_info(node_type)
