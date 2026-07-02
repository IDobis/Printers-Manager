import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


def build_alert_email(printer_name: str, model: str, ip: str, toner_code: str, quantity: int) -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    body {{ font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }}
    .card {{ max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 24px; border-left: 6px solid #dc2626; }}
    h1 {{ margin: 0 0 12px; color: #111827; font-size: 20px; }}
    p {{ color: #374151; line-height: 1.5; }}
    .code {{ display: inline-block; background: #fef2f2; color: #991b1b; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-family: monospace; }}
    .meta {{ margin-top: 16px; font-size: 14px; color: #6b7280; }}
  </style>
</head>
<body>
  <div class="card">
    <h1>Toner abaixo do limite</h1>
    <p>A impressora <strong>{printer_name}</strong> ({model}) atingiu quantidade crítica.</p>
    <p>Código do toner para abertura de SC:</p>
    <p><span class="code">{toner_code}</span></p>
    <div class="meta">
      IP: {ip}<br />
      Quantidade atual: {quantity}<br />
      Limite mínimo: {settings.quantity_threshold}
    </div>
  </div>
</body>
</html>"""


async def send_toner_alert(
    printer_name: str,
    model: str,
    ip: str,
    toner_code: str,
    quantity: int,
) -> bool:
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP não configurado. E-mail não enviado para %s.", printer_name)
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = f"[Toner] SC necessária — {model} ({toner_code})"
    message["From"] = settings.smtp_from or settings.smtp_user
    message["To"] = settings.alert_email

    html = build_alert_email(printer_name, model, ip, toner_code, quantity)
    message.attach(MIMEText(html, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
        )
        return True
    except Exception as exc:
        logger.error("Falha ao enviar e-mail: %s", exc)
        return False
