import asyncio
import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Printer
from app.services.email_service import send_toner_alert
from app.services.monitor import fetch_toner_quantity
from app.services.status import compute_status

logger = logging.getLogger(__name__)


async def refresh_printer_quantity(db: Session, printer: Printer) -> None:
    quantity = await fetch_toner_quantity(printer.ip)
    if quantity is not None:
        printer.quantity = quantity


async def process_alerts(db: Session, printer: Printer) -> None:
    status = compute_status(printer.quantity)

    if status == "green":
        printer.alert_sent = False
        return

    if printer.alert_sent:
        return

    sent = await send_toner_alert(
        printer.name,
        printer.model,
        printer.ip,
        printer.toner_code,
        printer.quantity,
    )
    if sent:
        printer.alert_sent = True


async def run_monitor_cycle(db: Session) -> dict:
    printers = db.query(Printer).all()
    updated = 0
    alerts = 0

    for printer in printers:
        before = printer.quantity
        await refresh_printer_quantity(db, printer)
        if printer.quantity != before:
            updated += 1
        await process_alerts(db, printer)
        if printer.alert_sent and compute_status(printer.quantity) == "red":
            alerts += 1

    db.commit()
    return {"checked": len(printers), "updated": updated, "alerts_active": alerts}


_monitor_task: asyncio.Task | None = None


async def monitor_loop(get_db_factory) -> None:
    while True:
        db = next(get_db_factory())
        try:
            result = await run_monitor_cycle(db)
            logger.info("Monitor cycle: %s", result)
        except Exception as exc:
            logger.error("Erro no monitor: %s", exc)
        finally:
            db.close()
        await asyncio.sleep(settings.monitor_interval_seconds)


def start_monitor(app_get_db) -> None:
    global _monitor_task
    if _monitor_task is None or _monitor_task.done():
        _monitor_task = asyncio.create_task(monitor_loop(app_get_db))
