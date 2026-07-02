export type PrinterStatus = "green" | "red";
export type SupplyType = "toner" | "tinta";

export interface InkColor {
  id: string;
  name: string;
  hex: string;
}

export interface Printer {
  id: string;
  name: string;
  model: string;
  ip: string;
  quantity: number;
  supplyType: SupplyType;
  tonerCode: string;
  inkColorId?: string;
}

export interface PrinterGroup {
  id: string;
  model: string;
  supplyType: SupplyType;
  tonerCode: string;
  totalQuantity: number;
  status: PrinterStatus;
  printers: Printer[];
  inkQuantities?: Record<string, number>;
}

export type PrinterFormData = Omit<Printer, "id">;

export function groupKey(supplyType: SupplyType, model: string): string {
  return `${supplyType}::${model}`;
}
