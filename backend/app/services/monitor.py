import asyncio
import logging

from pysnmp.hlapi.v3arch.asyncio import (
    CommunityData,
    ContextData,
    ObjectIdentity,
    ObjectType,
    SnmpEngine,
    UdpTransportTarget,
    get_cmd,
)

logger = logging.getLogger(__name__)

# OID comum para nível de toner (percentual) em impressoras de rede
TONER_LEVEL_OID = "1.3.6.1.2.1.43.11.1.1.9.1.1"


async def fetch_toner_quantity(ip: str, community: str = "public") -> int | None:
    """Consulta SNMP e converte percentual em quantidade estimada (0-5 toners)."""
    try:
        transport = await UdpTransportTarget.create((ip, 161), timeout=2, retries=1)
        error_indication, error_status, _error_index, var_binds = await get_cmd(
            SnmpEngine(),
            CommunityData(community),
            transport,
            ContextData(),
            ObjectType(ObjectIdentity(TONER_LEVEL_OID)),
        )

        if error_indication or error_status:
            return None

        for var_bind in var_binds:
            value = int(var_bind[1])
            if value < 0:
                return 0
            if value <= 100:
                return max(0, round(value / 20))
            return min(value, 10)
    except Exception as exc:
        logger.warning("SNMP falhou para %s: %s", ip, exc)
        return None


def fetch_toner_quantity_sync(ip: str, community: str = "public") -> int | None:
    return asyncio.run(fetch_toner_quantity(ip, community))
