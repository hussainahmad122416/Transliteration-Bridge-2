from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    histories = relationship("History", back_populates="owner")


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    input_text = Column(Text, nullable=False)
    output_text = Column(Text, nullable=False)
    direction = Column(String, nullable=False) # e.g., 'shahmukhi_to_gurmukhi' or 'gurmukhi_to_shahmukhi'
    timestamp = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="histories")
