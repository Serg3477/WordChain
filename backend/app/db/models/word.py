from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.db.base import Base

class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    word = Column(String(30), nullable=False, unique=True)
    translation = Column(String(300), nullable=False)
    translation_json = Column(JSONB, nullable=True)
    part_of_speech = Column(String(50))
    transcription = Column(String(50))

    examples = Column(JSONB, default=list)
    synonyms = Column(JSONB, default=list)
    antonyms = Column(JSONB, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="words")
    sets = relationship("Set", secondary="set_words", back_populates="words", lazy="selectin", cascade="all")



