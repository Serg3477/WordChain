from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base

class Set(Base):
    __tablename__ = "sets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    generated_text = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # user = relationship("User", back_populates="sets")
    words = relationship(
        "Word",
        secondary="set_words",
        back_populates="sets",
        lazy = "selectin"
    )
