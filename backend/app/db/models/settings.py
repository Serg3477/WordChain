from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    ui_theme = Column(String(20), default="light")
    language = Column(String(10), default="en")
    difficulty = Column(String(20), default="normal")

    auto_play_audio = Column(Boolean, default=False)
    show_transcription = Column(Boolean, default=True)
    notifications_enabled = Column(Boolean, default=True)

    user = relationship("User", back_populates="settings")
