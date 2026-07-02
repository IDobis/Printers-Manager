import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.models import Printer
from app.schemas import (
    ExportItem,
    ImportPayload,
    PrinterCreate,
    PrinterGroupResponse,
    PrinterResponse,
    PrinterUpdate,
)
from app.seed import seed_printers
from app.services.scheduler import run_monitor_cycle, start_monitor
from app.services.status import compute_status, group_printers, printer_to_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_printers()
    start_monitor(get_db)
    yield


app = FastAPI(title="Controle de Toners", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "tauri://localhost",
        "http://tauri.localhost",
        "https://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "threshold": settings.quantity_threshold}


@app.get("/api/printers", response_model=list[PrinterResponse])
def list_printers(db: Session = Depends(get_db)):
    printers = db.query(Printer).order_by(Printer.model, Printer.name).all()
    return [printer_to_response(p) for p in printers]


@app.get("/api/printers/groups", response_model=list[PrinterGroupResponse])
def list_printer_groups(db: Session = Depends(get_db)):
    printers = db.query(Printer).order_by(Printer.model, Printer.name).all()
    return group_printers(printers)


@app.post("/api/printers", response_model=PrinterResponse, status_code=201)
def create_printer(payload: PrinterCreate, db: Session = Depends(get_db)):
    existing = db.query(Printer).filter(Printer.ip == payload.ip).first()
    if existing:
        raise HTTPException(status_code=409, detail="IP já cadastrado")

    printer = Printer(**payload.model_dump())
    db.add(printer)
    db.commit()
    db.refresh(printer)
    return printer_to_response(printer)


@app.put("/api/printers/{printer_id}", response_model=PrinterResponse)
def update_printer(printer_id: int, payload: PrinterUpdate, db: Session = Depends(get_db)):
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=404, detail="Impressora não encontrada")

    data = payload.model_dump(exclude_unset=True)
    if "ip" in data:
        conflict = (
            db.query(Printer)
            .filter(Printer.ip == data["ip"], Printer.id != printer_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=409, detail="IP já cadastrado")

    for key, value in data.items():
        setattr(printer, key, value)

    if compute_status(printer.quantity) == "green":
        printer.alert_sent = False

    db.commit()
    db.refresh(printer)
    return printer_to_response(printer)


@app.delete("/api/printers/{printer_id}", status_code=204)
def delete_printer(printer_id: int, db: Session = Depends(get_db)):
    printer = db.query(Printer).filter(Printer.id == printer_id).first()
    if not printer:
        raise HTTPException(status_code=404, detail="Impressora não encontrada")
    db.delete(printer)
    db.commit()


@app.post("/api/monitor/run")
async def run_monitor(db: Session = Depends(get_db)):
    return await run_monitor_cycle(db)


@app.get("/api/export")
def export_data(db: Session = Depends(get_db)):
    printers = db.query(Printer).order_by(Printer.name).all()
    return [
        ExportItem(nome=p.name, ip=p.ip, quantidade=p.quantity).model_dump()
        for p in printers
    ]


@app.post("/api/import")
def import_data(payload: ImportPayload, db: Session = Depends(get_db)):
    created = 0
    updated = 0

    for item in payload.printers:
        printer = db.query(Printer).filter(Printer.ip == item.ip).first()
        if printer:
            printer.name = item.nome
            printer.quantity = item.quantidade
            updated += 1
        else:
            db.add(
                Printer(
                    name=item.nome,
                    model=item.nome,
                    ip=item.ip,
                    quantity=item.quantidade,
                    toner_code="PENDENTE",
                )
            )
            created += 1

    db.commit()
    return {"created": created, "updated": updated}
