import type { InkColor } from "./types";

const INK_COLORS_KEY = "controle-toners:ink-colors";

const DEFAULT_INK_COLORS: InkColor[] = [
  { id: "ink-preto", name: "Preto", hex: "#1a1a1a" },
  { id: "ink-ciano", name: "Ciano", hex: "#00acc1" },
  { id: "ink-magenta", name: "Magenta", hex: "#e91e63" },
  { id: "ink-amarelo", name: "Amarelo", hex: "#fbc02d" },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function newId(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `ink-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadInkColors(): InkColor[] {
  if (!isBrowser()) return [...DEFAULT_INK_COLORS];
  const raw = window.localStorage.getItem(INK_COLORS_KEY);
  if (!raw) {
    window.localStorage.setItem(INK_COLORS_KEY, JSON.stringify(DEFAULT_INK_COLORS));
    return [...DEFAULT_INK_COLORS];
  }
  try {
    const parsed = JSON.parse(raw) as InkColor[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_INK_COLORS];
  } catch {
    return [...DEFAULT_INK_COLORS];
  }
}

function persist(colors: InkColor[]): InkColor[] {
  if (isBrowser()) window.localStorage.setItem(INK_COLORS_KEY, JSON.stringify(colors));
  return colors;
}

export function addInkColor(current: InkColor[], name: string, hex: string): InkColor[] {
  return persist([...current, { id: newId(), name: name.trim(), hex }]);
}

export function getInkColor(colors: InkColor[], id?: string): InkColor | undefined {
  if (!id) return undefined;
  return colors.find((color) => color.id === id);
}

export function replaceInkColors(colors: InkColor[]): InkColor[] {
  return persist(colors);
}
