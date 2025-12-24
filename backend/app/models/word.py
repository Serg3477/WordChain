from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.dialects.postgresql import JSONB

class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    word = Column(String(100), nullable=False)
    translation = Column(String(255), nullable=False)
    part_of_speech = Column(String(50), nullable=True)

    examples = Column(JSONB, default=list)
    synonyms = Column(JSONB, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="words")
