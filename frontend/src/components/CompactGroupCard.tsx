"use client";

import CachedIcon from "@mui/icons-material/Cached";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import PaletteIcon from "@mui/icons-material/PaletteOutlined";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { PrinterGroup } from "@/lib/types";

interface CompactGroupCardProps {
  group: PrinterGroup;
  onEditGroupQuantity: (group: PrinterGroup) => void;
  onEditGroupInk: (group: PrinterGroup) => void;
  onToggleSupplyType: (group: PrinterGroup) => void;
  onOpenSupplyEmail: (group: PrinterGroup) => void;
}

export function CompactGroupCard({ group, onEditGroupQuantity, onEditGroupInk, onToggleSupplyType, onOpenSupplyEmail }: CompactGroupCardProps) {
  const isTinta = group.supplyType === "tinta";
  const [dragHover, setDragHover] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const yTransform = transform ? { ...transform, x: 0 } : null;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        transform: CSS.Transform.toString(yTransform),
        transition,
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 1 : 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isDragging || dragHover ? "primary.main" : "divider",
          bgcolor: "background.paper",
          borderLeft: "4px solid",
          borderLeftColor: group.status === "green" ? "success.main" : "error.main",
          boxShadow: dragHover ? 3 : 0,
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        }}
      >
        <Tooltip title="Arrastar para reordenar">
          <IconButton
            size="small"
            onMouseEnter={() => setDragHover(true)}
            onMouseLeave={() => setDragHover(false)}
            sx={{ cursor: isDragging ? "grabbing" : "grab", color: "text.secondary" }}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap title={group.model}>
            {group.model}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {isTinta ? "Tinta" : `Toner · ${group.tonerCode || "—"}`} · {group.printers.length} impressora(s)
          </Typography>
        </Box>

        <Tooltip title={`Alterar para ${isTinta ? "Toner" : "Tinta"}`}>
          <IconButton size="small" color="primary" onClick={() => onToggleSupplyType(group)}>
            <CachedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Chip
          size="small"
          icon={isTinta ? <PaletteIcon /> : <InventoryIcon />}
          label={`${isTinta ? "Tintas" : "Toners"}: ${group.totalQuantity}`}
          onClick={() => (isTinta ? onEditGroupInk(group) : onEditGroupQuantity(group))}
          variant="outlined"
          sx={{ cursor: "pointer" }}
        />

        <Chip
          size="small"
          color={group.status === "green" ? "success" : "error"}
          label={group.status === "green" ? "OK" : "Crítico"}
        />

        {group.status === "red" && (
          <Tooltip title="Gerar e-mail de SC">
            <IconButton size="small" color="error" onClick={() => onOpenSupplyEmail(group)}>
              <EmailIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
