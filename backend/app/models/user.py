from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, nullable=False)
    pin_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)

    settings = relationship("Settings", back_populates="user", uselist=False)
    words = relationship("Word", back_populates="user")
    sets = relationship("Set", back_populates="user")
