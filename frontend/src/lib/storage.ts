import type { InkColor, Printer, PrinterFormData, PrinterGroup, PrinterStatus, SupplyType } from "./types";
import { groupKey } from "./types";

const STORAGE_KEY = "controle-toners:printers";
const GROUP_ORDER_KEY = "controle-toners:group-order";
const GROUP_QUANTITY_KEY = "controle-toners:group-quantities";
const GROUP_INK_QUANTITY_KEY = "controle-toners:group-ink-quantities";
export const QUANTITY_THRESHOLD = 3;
export const ALERT_EMAIL = "lucas.dobis@calpar.com.br";

const DEFAULT_PRINTERS: Printer[] = [
  { id: "seed-1", name: "Recepção", model: "HP LaserJet Pro M404", ip: "192.168.1.101", quantity: 5, supplyType: "toner", tonerCode: "00INFHARTONTIRD" },
  { id: "seed-2", name: "Financeiro", model: "HP LaserJet Pro M404", ip: "192.168.1.102", quantity: 4, supplyType: "toner", tonerCode: "00INFHARTONTIRD" },
  { id: "seed-3", name: "Expedição", model: "Lexmark MS421dn", ip: "192.168.1.110", quantity: 2, supplyType: "toner", tonerCode: "00LEX421TNBLK01" },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function newId(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePrinter(printer: Printer): Printer {
  return {
    ...printer,
    supplyType: printer.supplyType ?? "toner",
    tonerCode: printer.tonerCode ?? "",
  };
}

export function loadPrinters(): Printer[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRINTERS));
    return [...DEFAULT_PRINTERS];
  }
  try {
    const parsed = JSON.parse(raw) as Printer[];
    return Array.isArray(parsed) ? parsed.map(normalizePrinter) : [];
  } catch {
    return [];
  }
}

function persist(printers: Printer[]): Printer[] {
  if (isBrowser()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
  return printers;
}

export function addPrinter(current: Printer[], data: PrinterFormData): Printer[] {
  return persist([normalizePrinter({ ...data, id: newId() }), ...current]);
}

export function updatePrinter(current: Printer[], id: string, data: PrinterFormData): Printer[] {
  return persist(current.map((printer) => (printer.id === id ? normalizePrinter({ ...printer, ...data }) : printer)));
}

export function removePrinters(current: Printer[], ids: string[]): Printer[] {
  const set = new Set(ids);
  return persist(current.filter((printer) => !set.has(printer.id)));
}

export function replaceAll(printers: Printer[]): Printer[] {
  return persist(printers.map(normalizePrinter));
}

export function setSupplyTypeForPrinters(current: Printer[], ids: string[], supplyType: SupplyType): Printer[] {
  const set = new Set(ids);
  return persist(
    current.map((printer) =>
      set.has(printer.id)
        ? normalizePrinter({
            ...printer,
            supplyType,
            tonerCode: supplyType === "toner" ? printer.tonerCode : "",
            inkColorId: supplyType === "tinta" ? printer.inkColorId : undefined,
          })
        : printer,
    ),
  );
}

export function loadGroupOrder(): string[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(GROUP_ORDER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGroupOrder(order: string[]): string[] {
  if (isBrowser()) window.localStorage.setItem(GROUP_ORDER_KEY, JSON.stringify(order));
  return order;
}

export function mergeGroupOrder(order: string[], groupIds: string[]): string[] {
  const merged = [...order.filter((id) => groupIds.includes(id)), ...groupIds.filter((id) => !order.includes(id))];
  saveGroupOrder(merged);
  return merged;
}

export function moveGroupToTop(order: string[], groupId: string): string[] {
  const next = [groupId, ...order.filter((id) => id !== groupId)];
  saveGroupOrder(next);
  return next;
}

export function orderGroups(groups: PrinterGroup[], order: string[]): PrinterGroup[] {
  const map = new Map(groups.map((group) => [group.id, group]));
  const ordered = order.map((id) => map.get(id)).filter((group): group is PrinterGroup => !!group);
  const rest = groups.filter((group) => !order.includes(group.id));
  return [...ordered, ...rest];
}

export function computeStatus(quantity: number): PrinterStatus {
  return quantity >= QUANTITY_THRESHOLD ? "green" : "red";
}

export function loadGroupQuantities(): Record<string, number> {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(GROUP_QUANTITY_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveGroupQuantity(quantities: Record<string, number>, groupId: string, quantity: number): Record<string, number> {
  const next = { ...quantities, [groupId]: quantity };
  if (isBrowser()) window.localStorage.setItem(GROUP_QUANTITY_KEY, JSON.stringify(next));
  return next;
}

export function resolveGroupTonerBase(
  printers: Printer[],
  quantities: Record<string, number>,
  groupId: string,
): number {
  if (quantities[groupId] != null) return quantities[groupId];
  const groupPrinters = printers.filter((p) => groupKey(p.supplyType ?? "toner", p.model) === groupId);
  if (groupPrinters.length === 1) return groupPrinters[0].quantity;
  return 0;
}

export function incrementGroupQuantity(
  quantities: Record<string, number>,
  groupId: string,
  amount: number,
  fallbackBase = 0,
): Record<string, number> {
  const current = quantities[groupId] ?? fallbackBase;
  return saveGroupQuantity(quantities, groupId, current + amount);
}

export function loadGroupInkQuantities(): Record<string, Record<string, number>> {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(GROUP_INK_QUANTITY_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, number>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveGroupInkQuantity(
  all: Record<string, Record<string, number>>,
  groupId: string,
  colorId: string,
  quantity: number,
): Record<string, Record<string, number>> {
  const groupColors = { ...(all[groupId] ?? {}), [colorId]: quantity };
  const next = { ...all, [groupId]: groupColors };
  if (isBrowser()) window.localStorage.setItem(GROUP_INK_QUANTITY_KEY, JSON.stringify(next));
  return next;
}

export function replaceGroupInkQuantities(quantities: Record<string, Record<string, number>>): Record<string, Record<string, number>> {
  if (isBrowser()) window.localStorage.setItem(GROUP_INK_QUANTITY_KEY, JSON.stringify(quantities));
  return quantities;
}

export function replaceGroupQuantities(quantities: Record<string, number>): Record<string, number> {
  if (isBrowser()) window.localStorage.setItem(GROUP_QUANTITY_KEY, JSON.stringify(quantities));
  return quantities;
}

function seedInkQuantitiesFromPrinters(printers: Printer[]): Record<string, number> {
  const seeded: Record<string, number> = {};
  for (const printer of printers) {
    if (printer.inkColorId) {
      seeded[printer.inkColorId] = printer.quantity;
    }
  }
  return seeded;
}

function resolveGroupInkQuantities(
  groupId: string,
  printers: Printer[],
  stored: Record<string, Record<string, number>>,
): Record<string, number> {
  const saved = stored[groupId];
  if (saved && Object.keys(saved).length > 0) return saved;
  return seedInkQuantitiesFromPrinters(printers);
}

function resolveTonerStatus(group: PrinterGroup, groupQuantities: Record<string, number>): { totalQuantity: number; status: PrinterStatus } {
  const totalQuantity =
    groupQuantities[group.id] ?? (group.printers.length === 1 ? group.printers[0].quantity : 0);
  return { totalQuantity, status: computeStatus(totalQuantity) };
}

function resolveTintaStatus(inkQuantities: Record<string, number>): { totalQuantity: number; status: PrinterStatus } {
  const values = Object.values(inkQuantities);
  const totalQuantity = values.reduce((sum, qty) => sum + qty, 0);
  const status = values.some((qty) => computeStatus(qty) === "red") ? "red" : "green";
  return { totalQuantity, status };
}

export function groupByModel(
  printers: Printer[],
  groupQuantities: Record<string, number> = {},
  groupInkQuantities: Record<string, Record<string, number>> = {},
): PrinterGroup[] {
  const groups = new Map<string, PrinterGroup>();

  for (const printer of printers) {
    const supplyType: SupplyType = printer.supplyType ?? "toner";
    const id = groupKey(supplyType, printer.model);
    const existing = groups.get(id);
    if (existing) {
      existing.printers.push(printer);
    } else {
      groups.set(id, {
        id,
        model: printer.model,
        supplyType,
        tonerCode: printer.tonerCode,
        totalQuantity: printer.quantity,
        status: "green",
        printers: [printer],
      });
    }
  }

  return Array.from(groups.values()).map((group) => {
    const inkQuantities =
      group.supplyType === "tinta" ? resolveGroupInkQuantities(group.id, group.printers, groupInkQuantities) : undefined;
    const resolved =
      group.supplyType === "tinta" ? resolveTintaStatus(inkQuantities ?? {}) : resolveTonerStatus(group, groupQuantities);
    return { ...group, ...resolved, inkQuantities };
  });
}

export interface BackupData {
  printers: Printer[];
  inkColors?: InkColor[];
  groupQuantities?: Record<string, number>;
  groupInkQuantities?: Record<string, Record<string, number>>;
}

export function exportBackup(
  printers: Printer[],
  inkColors: InkColor[],
  groupQuantities?: Record<string, number>,
  groupInkQuantities?: Record<string, Record<string, number>>,
): string {
  return JSON.stringify({ printers, inkColors, groupQuantities, groupInkQuantities }, null, 2);
}

export function parseImport(raw: string): BackupData {
  const parsed = JSON.parse(raw);

  function parsePrinterArray(items: unknown[]): Printer[] {
    return items.map((item) => {
      const record = item as Record<string, unknown>;
      const name = String(record.name ?? record.nome ?? "");
      const quantity = Number(record.quantity ?? record.quantidade ?? 0);
      return normalizePrinter({
        id: typeof record.id === "string" ? record.id : newId(),
        name,
        model: String(record.model ?? record.modelo ?? name),
        ip: String(record.ip ?? ""),
        quantity: Number.isFinite(quantity) ? quantity : 0,
        supplyType: (record.supplyType as SupplyType) ?? "toner",
        tonerCode: String(record.tonerCode ?? record.toner_code ?? record.codigo ?? "PENDENTE"),
        inkColorId: typeof record.inkColorId === "string" ? record.inkColorId : undefined,
      });
    });
  }

  if (Array.isArray(parsed)) {
    return { printers: parsePrinterArray(parsed) };
  }
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as BackupData).printers)) {
    const data = parsed as BackupData & { printers: unknown[] };
    return {
      printers: parsePrinterArray(data.printers),
      inkColors: Array.isArray(data.inkColors) ? data.inkColors : undefined,
      groupQuantities: data.groupQuantities && typeof data.groupQuantities === "object" ? data.groupQuantities : undefined,
      groupInkQuantities:
        data.groupInkQuantities && typeof data.groupInkQuantities === "object" ? data.groupInkQuantities : undefined,
    };
  }
  throw new Error("JSON inválido");
}
