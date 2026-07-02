from app.database import SessionLocal
from app.models import Printer

DEFAULT_PRINTERS = [
    {
        "name": "Recepção",
        "model": "HP LaserJet Pro M404",
        "ip": "192.168.1.101",
        "quantity": 5,
        "toner_code": "00INFHARTONTIRD",
    },
    {
        "name": "Financeiro",
        "model": "HP LaserJet Pro M404",
        "ip": "192.168.1.102",
        "quantity": 4,
        "toner_code": "00INFHARTONTIRD",
    },
    {
        "name": "Expedição",
        "model": "Lexmark MS421dn",
        "ip": "192.168.1.110",
        "quantity": 2,
        "toner_code": "00LEX421TNBLK01",
    },
]


def seed_printers() -> None:
    db = SessionLocal()
    try:
        if db.query(Printer).count() > 0:
            return
        for item in DEFAULT_PRINTERS:
            db.add(Printer(**item))
        db.commit()
    finally:
        db.close()
