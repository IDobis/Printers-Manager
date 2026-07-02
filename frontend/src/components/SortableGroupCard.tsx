"use client";

import CachedIcon from "@mui/icons-material/Cached";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/EditOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import PaletteIcon from "@mui/icons-material/PaletteOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Printer, PrinterGroup } from "@/lib/types";

interface SortableGroupCardProps {
  group: PrinterGroup;
  onEdit: (printer: Printer) => void;
  onEditGroupQuantity: (group: PrinterGroup) => void;
  onEditGroupInk: (group: PrinterGroup) => void;
  onToggleSupplyType: (group: PrinterGroup) => void;
  onOpenSupplyEmail: (group: PrinterGroup) => void;
}

export function SortableGroupCard({ group, onEdit, onEditGroupQuantity, onEditGroupInk, onToggleSupplyType, onOpenSupplyEmail }: SortableGroupCardProps) {
  const isTinta = group.supplyType === "tinta";
  const isToner = !isTinta;
  const [dragHover, setDragHover] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  });

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
      <Card
        sx={{
          borderColor: isDragging || dragHover ? "primary.main" : undefined,
          boxShadow: dragHover ? 6 : undefined,
          transform: dragHover && !isDragging ? "translateY(-2px)" : undefined,
          transition: "box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Tooltip title="Arrastar para reordenar">
              <IconButton
                size="small"
                onMouseEnter={() => setDragHover(true)}
                onMouseLeave={() => setDragHover(false)}
                sx={{ mt: 0.5, cursor: isDragging ? "grabbing" : "grab", color: "text.secondary" }}
                {...attributes}
                {...listeners}
              >
                <DragIndicatorIcon />
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="h6">{group.model}</Typography>
                    <Tooltip title={`Alterar para ${isTinta ? "Toner" : "Tinta"}`}>
                      <IconButton size="small" color="primary" onClick={() => onToggleSupplyType(group)}>
                        <CachedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Chip size="small" label={isTinta ? "Tinta" : "Toner"} color={isTinta ? "info" : "default"} variant="outlined" />
                  </Stack>
                  {!isTinta && (
                    <Typography variant="body2" color="text.secondary">
                      Código toner: <Box component="span" sx={{ fontFamily: "monospace" }}>{group.tonerCode}</Box>
                    </Typography>
                  )}
                </Box>
                <Chip color={group.status === "green" ? "success" : "error"} label={group.status === "green" ? "OK" : "Crítico"} />
              </Stack>

              {isToner && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                  <Button variant="outlined" size="large" startIcon={<InventoryIcon />} endIcon={<EditIcon />} onClick={() => onEditGroupQuantity(group)}>
                    Toners: {group.totalQuantity}
                  </Button>
                  {group.status === "red" && (
                    <Button color="error" variant="outlined" startIcon={<EmailIcon />} onClick={() => onOpenSupplyEmail(group)}>
                      Gerar e-mail de SC
                    </Button>
                  )}
                </Stack>
              )}

              {isTinta && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                  <Button variant="outlined" size="large" startIcon={<PaletteIcon />} endIcon={<EditIcon />} onClick={() => onEditGroupInk(group)}>
                    Tintas: {group.totalQuantity}
                  </Button>
                  {group.status === "red" && (
                    <Button color="error" variant="outlined" startIcon={<EmailIcon />} onClick={() => onOpenSupplyEmail(group)}>
                      Gerar e-mail de SC
                    </Button>
                  )}
                </Stack>
              )}

              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.printers.map((printer) => (
                    <TableRow key={printer.id} hover>
                      <TableCell>{printer.name}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{printer.ip}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => onEdit(printer)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
