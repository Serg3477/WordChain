from sqlalchemy import Column, Integer, DateTime, ForeignKey, func
from app.db.base import Base

class SetWord(Base):
    __tablename__ = "set_words"

    set_id = Column(Integer, ForeignKey("sets.id", ondelete="CASCADE"), primary_key=True)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), primary_key=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
