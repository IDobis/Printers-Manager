"use client";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { InkColor } from "@/lib/types";

interface InkColorPickerProps {
  colors: InkColor[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, hex: string) => void;
}

export function InkColorPicker({ colors, selectedId, onSelect, onCreate }: InkColorPickerProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#2563eb");

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(name.trim(), hex);
    setName("");
    setHex("#2563eb");
    setCreating(false);
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Cor da tinta</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {colors.map((color) => {
          const selected = selectedId === color.id;
          return (
            <Chip
              key={color.id}
              label={color.name}
              onClick={() => onSelect(color.id)}
              variant={selected ? "filled" : "outlined"}
              color={selected ? "primary" : "default"}
              icon={
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: color.hex,
                    border: "1px solid",
                    borderColor: "divider",
                    ml: 0.5,
                  }}
                />
              }
              sx={{ pl: 0.5 }}
            />
          );
        })}
        <Chip
          icon={<AddIcon />}
          label="Nova cor"
          variant="outlined"
          onClick={() => setCreating((v) => !v)}
          clickable
        />
      </Box>

      <Collapse in={creating}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 1 }}>
          <TextField
            label="Nome da cor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            placeholder="Ex: Azul"
          />
          <TextField
            label="Cor"
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", sm: 120 } }}
            slotProps={{ htmlInput: { style: { height: 40, cursor: "pointer" } } }}
          />
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim()} sx={{ whiteSpace: "nowrap" }}>
            Criar cor
          </Button>
        </Stack>
      </Collapse>
    </Stack>
  );
}

export function InkColorBadge({ color }: { color: InkColor }) {
  return (
    <Chip
      size="small"
      label={color.name}
      icon={
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: color.hex,
            border: "1px solid",
            borderColor: "divider",
            ml: 0.5,
          }}
        />
      }
      sx={{ pl: 0.5 }}
    />
  );
}
