"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { InkColorPicker } from "@/components/InkColorPicker";
import type { InkColor, PrinterGroup } from "@/lib/types";

interface GroupInkDialogProps {
  open: boolean;
  group: PrinterGroup | null;
  inkColors: InkColor[];
  inkQuantities: Record<string, number>;
  onClose: () => void;
  onSave: (groupId: string, colorId: string, quantity: number) => void;
  onCreateInkColor: (name: string, hex: string) => InkColor;
}

export function GroupInkDialog({
  open,
  group,
  inkColors,
  inkQuantities,
  onClose,
  onSave,
  onCreateInkColor,
}: GroupInkDialogProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>();
  const [quantityInput, setQuantityInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !group) return;
    const firstColor = inkColors[0]?.id;
    setSelectedColorId(firstColor);
    setQuantityInput(firstColor ? String(inkQuantities[firstColor] ?? 0) : "");
    setError("");
  }, [open, group, inkColors]);

  function handleColorSelect(colorId: string) {
    setSelectedColorId(colorId);
    setQuantityInput(String(inkQuantities[colorId] ?? 0));
    setError("");
  }

  function handleSave() {
    if (!group || !selectedColorId) {
      setError("Selecione uma cor.");
      return;
    }
    const trimmed = quantityInput.trim();
    if (trimmed === "" || Number.isNaN(Number(trimmed))) {
      setError("Informe um número válido.");
      return;
    }
    const quantity = Number(trimmed);
    if (quantity < 0) {
      setError("Informe um número válido.");
      return;
    }
    onSave(group.id, selectedColorId, quantity);
    onClose();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" onKeyDown={handleKeyDown}>
      <DialogTitle>Tintas do grupo</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {group?.model} · selecione a cor e informe a quantidade
          </Typography>
          <InkColorPicker
            colors={inkColors}
            selectedId={selectedColorId}
            onSelect={handleColorSelect}
            onCreate={(name, hex) => {
              const created = onCreateInkColor(name, hex);
              setSelectedColorId(created.id);
              setQuantityInput(String(inkQuantities[created.id] ?? 0));
            }}
          />
          <TextField
            label="Quantidade desta cor"
            type="number"
            value={quantityInput}
            onChange={(e) => {
              setQuantityInput(e.target.value);
              setError("");
            }}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { min: 0 } }}
            error={!!error}
            helperText={error || "Quantidade de cartuchos da cor selecionada"}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
