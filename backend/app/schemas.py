from datetime import datetime

from pydantic import BaseModel, Field


class PrinterBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    model: str = Field(..., min_length=1, max_length=120)
    ip: str = Field(..., min_length=7, max_length=45)
    quantity: int = Field(default=0, ge=0)
    toner_code: str = Field(..., min_length=1, max_length=64)


class PrinterCreate(PrinterBase):
    pass


class PrinterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    model: str | None = Field(default=None, min_length=1, max_length=120)
    ip: str | None = Field(default=None, min_length=7, max_length=45)
    quantity: int | None = Field(default=None, ge=0)
    toner_code: str | None = Field(default=None, min_length=1, max_length=64)


class PrinterResponse(PrinterBase):
    id: int
    status: str
    alert_sent: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrinterGroupResponse(BaseModel):
    model: str
    total_quantity: int
    status: str
    toner_code: str
    printers: list[PrinterResponse]


class ExportItem(BaseModel):
    nome: str
    ip: str
    quantidade: int


class ImportPayload(BaseModel):
    printers: list[ExportItem]
