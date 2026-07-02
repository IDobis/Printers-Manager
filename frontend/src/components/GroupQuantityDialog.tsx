"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import type { PrinterGroup } from "@/lib/types";

interface GroupQuantityDialogProps {
  open: boolean;
  group: PrinterGroup | null;
  onClose: () => void;
  onSave: (groupId: string, quantity: number) => void;
}

function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function GroupQuantityDialog({ open, group, onClose, onSave }: GroupQuantityDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && group) {
      setQuantity(String(group.totalQuantity));
      setError("");
    }
  }, [open, group]);

  function handleSave() {
    if (!group) return;
    const parsed = parseQuantity(quantity);
    if (parsed === null) {
      setError("Informe um número válido.");
      return;
    }
    onSave(group.id, parsed);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Quantidade agrupada</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {group?.model} · {group?.printers.length} impressora(s) no grupo
          </Typography>
          <TextField
            label="Toners disponíveis (grupo)"
            type="number"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (error) setError("");
            }}
            fullWidth
            autoFocus
            error={!!error}
            helperText={error}
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
