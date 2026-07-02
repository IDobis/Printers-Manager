from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Printer(Base):
    __tablename__ = "printers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    model: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    ip: Mapped[str] = mapped_column(String(45), nullable=False, unique=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    toner_code: Mapped[str] = mapped_column(String(64), nullable=False)
    alert_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
