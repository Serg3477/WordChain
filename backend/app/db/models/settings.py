from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    input_lang = Column(String, default="en")
    output_lang = Column(String, default="ru")
    user_level = Column(String, default="B1")
    text_size = Column(Integer, default=6)
    examples_count = Column(Integer, default=6)
    ui_theme = Column(String(20), default="light")
    ui_lang = Column(String(10), default="en")
    voice_type = Column(String, default="shimmer")

    user = relationship("User", back_populates="settings")
