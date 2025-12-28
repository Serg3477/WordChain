from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)

    auto_play_audio = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    words = relationship("Word", back_populates="user")
