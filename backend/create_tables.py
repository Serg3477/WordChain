from app.db.base import Base
from app.db.session import engine
from app.db.models.user import User
from app.db.models.word import Word


# Импортируем модели, чтобы SQLAlchemy их увидел
from app.db.models.user import User
from app.db.models.word import Word

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
