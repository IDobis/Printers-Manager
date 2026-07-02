"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { buildSupplyMailto, parseEmailList, TI_CONTACTS } from "@/lib/mailto";
import type { InkColor, PrinterGroup } from "@/lib/types";

interface SupplyEmailDialogProps {
  open: boolean;
  group: PrinterGroup | null;
  inkColors: InkColor[];
  onClose: () => void;
}

export function SupplyEmailDialog({ open, group, inkColors, onClose }: SupplyEmailDialogProps) {
  const [extraEmails, setExtraEmails] = useState("");
  const [tiSelected, setTiSelected] = useState<string[]>(["lucas"]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setExtraEmails("");
      setTiSelected(["lucas"]);
      setError("");
    }
  }, [open, group]);

  function handleGenerate() {
    if (!group) return;

    const tiEmails = tiSelected
      .map((id) => TI_CONTACTS.find((contact) => contact.id === id)?.email)
      .filter((email): email is (typeof TI_CONTACTS)[number]["email"] => !!email);
    const recipients = [...new Set([...tiEmails, ...parseEmailList(extraEmails)])];

    if (recipients.length === 0) {
      setError("Selecione ao menos um destinatário da TI ou informe um e-mail.");
      return;
    }

    window.location.href = buildSupplyMailto(group, inkColors, recipients);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Gerar e-mail de SC</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {group?.model} · {group?.supplyType === "tinta" ? "Tinta" : "Toner"}
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="ti-select-label">TI</InputLabel>
            <Select
              labelId="ti-select-label"
              label="TI"
              multiple
              value={tiSelected}
              onChange={(e) => {
                setTiSelected(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value);
                setError("");
              }}
              renderValue={(selected) =>
                selected
                  .map((id) => TI_CONTACTS.find((contact) => contact.id === id)?.name)
                  .filter(Boolean)
                  .join(", ")
              }
            >
              {TI_CONTACTS.map((contact) => (
                <MenuItem key={contact.id} value={contact.id}>
                  {contact.name} ({contact.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="E-mails adicionais"
            value={extraEmails}
            onChange={(e) => {
              setExtraEmails(e.target.value);
              setError("");
            }}
            fullWidth
            multiline
            minRows={2}
            placeholder="compras@empresa.com.br; fornecedor@empresa.com.br"
            error={!!error}
            helperText={error || "Separe múltiplos e-mails com ponto e vírgula (;)"}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={handleGenerate} variant="contained">Gerar e-mail</Button>
      </DialogActions>
    </Dialog>
  );
}
