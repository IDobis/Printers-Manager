"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import type { Printer, PrinterFormData, SupplyType } from "@/lib/types";

const EMPTY: PrinterFormData = {
  name: "",
  model: "",
  ip: "",
  quantity: 0,
  supplyType: "toner",
  tonerCode: "",
};

interface PrinterDialogProps {
  open: boolean;
  editing: Printer | null;
  onClose: () => void;
  onSave: (data: PrinterFormData) => void;
}

export function PrinterDialog({ open, editing, onClose, onSave }: PrinterDialogProps) {
  const [form, setForm] = useState<PrinterFormData>(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : EMPTY);
      setError("");
    }
  }, [open, editing]);

  function handleSave() {
    if (!form.name.trim() || !form.model.trim() || !form.ip.trim()) {
      setError("Preencha nome, modelo e IP.");
      return;
    }
    if (form.supplyType === "toner" && !form.tonerCode.trim()) {
      setError("Informe o código do toner.");
      return;
    }
    onSave({
      ...form,
      quantity: !editing && form.supplyType === "toner" ? Number(form.quantity) || 0 : 0,
      tonerCode: form.supplyType === "toner" ? form.tonerCode : "",
      inkColorId: undefined,
    });
  }

  function handleTypeChange(type: SupplyType) {
    setForm((current) => ({
      ...current,
      supplyType: type,
      inkColorId: undefined,
    }));
    setError("");
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? "Editar impressora" : "Nova impressora"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <FormControl>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Tipo de suprimento</Typography>
            <RadioGroup row value={form.supplyType} onChange={(e) => handleTypeChange(e.target.value as SupplyType)}>
              <FormControlLabel value="toner" control={<Radio />} label="Toner" />
              <FormControlLabel value="tinta" control={<Radio />} label="Tinta" />
            </RadioGroup>
          </FormControl>

          <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth autoFocus />
          <TextField
            label="Modelo"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            fullWidth
            helperText={form.supplyType === "toner" ? "Mesmo modelo agrupa a quantidade" : "Mesmo modelo agrupa as cores de tinta"}
          />
          <TextField label="IP" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} fullWidth />

          {form.supplyType === "toner" ? (
            <>
              {!editing && (
                <TextField
                  label="Quantidade de toners"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  fullWidth
                  slotProps={{ htmlInput: { min: 0 } }}
                  helperText="Será somada ao grupo se o modelo já existir"
                />
              )}
              <TextField
                label="Código do toner"
                value={form.tonerCode}
                onChange={(e) => setForm({ ...form, tonerCode: e.target.value })}
                fullWidth
                error={!!error}
                helperText={error || (editing ? "Quantidade é gerenciada no botão Toners do grupo" : undefined)}
              />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              As cores e quantidades são gerenciadas no botão &quot;Tintas&quot; do grupo após o cadastro.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleSave} variant="contained">{editing ? "Salvar" : "Cadastrar"}</Button>
      </DialogActions>
    </Dialog>
  );
}
