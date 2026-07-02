from app.config import settings


def compute_status(quantity: int) -> str:
    return "green" if quantity >= settings.quantity_threshold else "red"


def printer_to_response(printer) -> dict:
    return {
        "id": printer.id,
        "name": printer.name,
        "model": printer.model,
        "ip": printer.ip,
        "quantity": printer.quantity,
        "toner_code": printer.toner_code,
        "status": compute_status(printer.quantity),
        "alert_sent": printer.alert_sent,
        "updated_at": printer.updated_at,
    }


def group_printers(printers) -> list[dict]:
    groups: dict[str, dict] = {}

    for printer in printers:
        key = printer.model
        if key not in groups:
            groups[key] = {
                "model": printer.model,
                "total_quantity": 0,
                "toner_code": printer.toner_code,
                "printers": [],
            }
        groups[key]["total_quantity"] += printer.quantity
        groups[key]["printers"].append(printer_to_response(printer))

    result = []
    for group in groups.values():
        group["status"] = compute_status(group["total_quantity"])
        result.append(group)

    result.sort(key=lambda item: item["model"])
    return result
