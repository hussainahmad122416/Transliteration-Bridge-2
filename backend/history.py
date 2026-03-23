from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, Field
from datetime import datetime

from backend.database import get_db
from backend.models import History, User
from backend.auth import get_current_user

history_router = APIRouter(prefix="/api/history", tags=["History"])

# Pydantic models
class HistoryCreate(BaseModel):
    input_text: str = Field(..., max_length=15000, description="Max 15,000 chars of history source.")
    output_text: str = Field(..., max_length=15000, description="Max 15,000 chars of history output.")
    direction: str = Field(..., max_length=100)

class HistoryResponse(BaseModel):
    id: int
    input_text: str
    output_text: str
    direction: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Routes
@history_router.post("/", response_model=HistoryResponse)
def save_history(item: HistoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_history = History(
        user_id=current_user.id,
        input_text=item.input_text,
        output_text=item.output_text,
        direction=item.direction
    )
    db.add(new_history)
    db.commit()
    db.refresh(new_history)
    return new_history

@history_router.get("/", response_model=List[HistoryResponse])
def get_user_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    histories = db.query(History).filter(History.user_id == current_user.id).order_by(History.timestamp.desc()).all()
    return histories

@history_router.delete("/{history_id}")
def delete_history_item(history_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history_item = db.query(History).filter(History.id == history_id, History.user_id == current_user.id).first()
    if not history_item:
        raise HTTPException(status_code=404, detail="History not found or unauthorized")
        
    db.delete(history_item)
    db.commit()
    return {"message": "Deleted successfully"}
