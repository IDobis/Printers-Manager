"use client";

import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import type { Printer } from "@/lib/types";

interface RemovePrintersDialogProps {
  open: boolean;
  printers: Printer[];
  onClose: () => void;
  onRemove: (ids: string[]) => void;
}

export function RemovePrintersDialog({ open, printers, onClose, onRemove }: RemovePrintersDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  const sorted = useMemo(
    () => [...printers].sort((a, b) => a.model.localeCompare(b.model) || a.name.localeCompare(b.name)),
    [printers],
  );

  const allSelected = sorted.length > 0 && selected.size === sorted.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(sorted.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirmRemove() {
    onRemove(Array.from(selected));
    setConfirmOpen(false);
    onClose();
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Gerenciar remoção de impressoras</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="info" sx={{ mt: 1 }}>
              Selecione uma ou mais impressoras para remover. A ação não pode ser desfeita.
            </Alert>

            {sorted.length === 0 ? (
              <Typography color="text.secondary">Nenhuma impressora cadastrada.</Typography>
            ) : (
              <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={someSelected}
                          checked={allSelected}
                          onChange={toggleAll}
                        />
                      </TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Nome</TableCell>
                      <TableCell>Modelo</TableCell>
                      <TableCell>IP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sorted.map((printer) => (
                      <TableRow
                        key={printer.id}
                        hover
                        selected={selected.has(printer.id)}
                        onClick={() => toggleOne(printer.id)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selected.has(printer.id)} onChange={() => toggleOne(printer.id)} />
                        </TableCell>
                        <TableCell>{printer.supplyType === "tinta" ? "Tinta" : "Toner"}</TableCell>
                        <TableCell>{printer.name}</TableCell>
                        <TableCell>{printer.model}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{printer.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary">
              {selected.size} selecionada(s)
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            disabled={selected.size === 0}
            onClick={() => setConfirmOpen(true)}
          >
            Remover selecionadas
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar remoção</DialogTitle>
        <DialogContent>
          <Typography>
            Remover {selected.size} impressora(s)? Essa ação é permanente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">Voltar</Button>
          <Button onClick={handleConfirmRemove} color="error" variant="contained">Remover</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
