from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, nullable=False, default="Guest")
    email = Column(String(100), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=True, default=None)
    avatar_url = Column(String(255), nullable=True, default="user-icon.png")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # last_login = Column(DateTime(timezone=True), nullable=True)

    is_guest = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)

    settings = relationship("Settings", back_populates="user", uselist=False)
    words = relationship("Word", back_populates="user", cascade="all, delete-orphan")
    # sets = relationship("Set", back_populates="user")
