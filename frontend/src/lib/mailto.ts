import { QUANTITY_THRESHOLD } from "./storage";
import type { InkColor, PrinterGroup } from "./types";

export const TI_CONTACTS = [
  { id: "lucas", name: "Lucas", email: "lucas.dobis@calpar.com.br" },
  { id: "guilherme", name: "Guilherme", email: "guilherme.bomfim@calpar.com.br" },
  { id: "nicolas", name: "Nicolas", email: "nicolas.correa@calpar.com.br" },
  { id: "wesley", name: "Wesley", email: "wesley.edevan@calpar.com.br" },
] as const;

export function parseEmailList(raw: string): string[] {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildSupplyMailto(group: PrinterGroup, inkColors: InkColor[], to: string[]): string {
  const isTinta = group.supplyType === "tinta";
  const subject = isTinta
    ? `[Tinta] Solicitação de SC - ${group.model}`
    : `[Toner] Solicitação de SC - ${group.model} (${group.tonerCode})`;

  const lines = isTinta
    ? [
        "Solicitação de compra de tinta.",
        "",
        `Modelo: ${group.model}`,
        `Limite mínimo: ${QUANTITY_THRESHOLD}`,
        "",
        "Cartuchos críticos:",
        ...Object.entries(group.inkQuantities ?? {})
          .filter(([, qty]) => qty < QUANTITY_THRESHOLD)
          .map(([colorId, qty]) => {
            const color = inkColors.find((c) => c.id === colorId);
            return `- ${color?.name ?? "Cor"} · qtd ${qty}`;
          }),
        "",
        "Impressoras:",
        ...group.printers.map((printer) => `- ${printer.name} (${printer.ip})`),
      ]
    : [
        "Solicitação de compra de toner.",
        "",
        `Modelo: ${group.model}`,
        `Código do toner: ${group.tonerCode}`,
        `Quantidade atual: ${group.totalQuantity}`,
        `Limite mínimo: ${QUANTITY_THRESHOLD}`,
        "",
        "Impressoras:",
        ...group.printers.map((printer) => `- ${printer.name} (${printer.ip})`),
      ];

  const recipients = [...new Set(to)].join(",");
  return `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
