"use client";

import AddIcon from "@mui/icons-material/Add";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DownloadIcon from "@mui/icons-material/Download";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadIcon from "@mui/icons-material/Upload";
import ViewAgendaIcon from "@mui/icons-material/ViewAgendaOutlined";
import ViewListIcon from "@mui/icons-material/ViewListOutlined";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import { CompactGroupCard } from "@/components/CompactGroupCard";
import { GroupQuantityDialog } from "@/components/GroupQuantityDialog";
import { GroupInkDialog } from "@/components/GroupInkDialog";
import { PrinterDialog } from "@/components/PrinterDialog";
import { SupplyEmailDialog } from "@/components/SupplyEmailDialog";
import { RemovePrintersDialog } from "@/components/RemovePrintersDialog";
import { SortableGroupCard } from "@/components/SortableGroupCard";
import { createRestrictToListBottom } from "@/lib/dndModifiers";
import { addInkColor, loadInkColors, replaceInkColors } from "@/lib/inkColors";
import {
  addPrinter,
  exportBackup,
  groupByModel,
  loadGroupOrder,
  loadGroupQuantities,
  incrementGroupQuantity,
  loadGroupInkQuantities,
  loadPrinters,
  mergeGroupOrder,
  moveGroupToTop,
  orderGroups,
  parseImport,
  removePrinters,
  replaceAll,
  replaceGroupInkQuantities,
  replaceGroupQuantities,
  resolveGroupTonerBase,
  saveGroupOrder,
  saveGroupQuantity,
  saveGroupInkQuantity,
  setSupplyTypeForPrinters,
  updatePrinter,
} from "@/lib/storage";
import type { InkColor, Printer, PrinterFormData, PrinterGroup } from "@/lib/types";
import { groupKey } from "@/lib/types";
import { useColorMode } from "@/theme/ThemeRegistry";

export function Dashboard() {
  const { mode, toggle } = useColorMode();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [inkColors, setInkColors] = useState<InkColor[]>([]);
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  const [groupQuantities, setGroupQuantities] = useState<Record<string, number>>({});
  const [groupInkQuantities, setGroupInkQuantities] = useState<Record<string, Record<string, number>>>({});
  const [ready, setReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupQtyOpen, setGroupQtyOpen] = useState(false);
  const [groupInkOpen, setGroupInkOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PrinterGroup | null>(null);
  const [emailGroup, setEmailGroup] = useState<PrinterGroup | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<"comfortable" | "compact">("comfortable");
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const dragModifiers = useMemo(
    () => [restrictToVerticalAxis, createRestrictToListBottom(listRef)],
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setPrinters(loadPrinters());
    setInkColors(loadInkColors());
    setGroupOrder(loadGroupOrder());
    setGroupQuantities(loadGroupQuantities());
    setGroupInkQuantities(loadGroupInkQuantities());
    const savedView = window.localStorage.getItem("controle-toners:view-mode");
    if (savedView === "compact" || savedView === "comfortable") setViewMode(savedView);
    setReady(true);
  }, []);

  function handleViewModeChange(_: unknown, next: "comfortable" | "compact" | null) {
    if (!next) return;
    setViewMode(next);
    window.localStorage.setItem("controle-toners:view-mode", next);
  }

  const groups = useMemo(
    () => groupByModel(printers, groupQuantities, groupInkQuantities),
    [printers, groupQuantities, groupInkQuantities],
  );

  useEffect(() => {
    if (!ready) return;
    const ids = groups.map((group) => group.id);
    setGroupOrder((current) => mergeGroupOrder(current, ids));
  }, [groups, ready]);

  const orderedGroups = useMemo(() => orderGroups(groups, groupOrder), [groups, groupOrder]);
  const criticalCount = orderedGroups.filter((group) => group.status === "red").length;

  function handleSave(data: PrinterFormData) {
    if (editing) {
      setPrinters((current) =>
        updatePrinter(current, editing.id, {
          ...data,
          quantity: editing.quantity,
        }),
      );
      setToast("Impressora atualizada.");
    } else {
      const tonerQty = data.supplyType === "toner" ? Number(data.quantity) || 0 : 0;
      const groupId = groupKey(data.supplyType ?? "toner", data.model);
      setPrinters((current) => addPrinter(current, { ...data, quantity: 0 }));
      setGroupOrder((current) => moveGroupToTop(current, groupId));
      if (data.supplyType === "toner" && tonerQty > 0) {
        setGroupQuantities((current) => {
          const base = resolveGroupTonerBase(printers, current, groupId);
          return incrementGroupQuantity(current, groupId, tonerQty, base);
        });
      }
      setToast("Impressora cadastrada.");
    }
    setDialogOpen(false);
    setEditing(null);
  }

  function handleCreateInkColor(name: string, hex: string): InkColor {
    const next = addInkColor(inkColors, name, hex);
    const created = next[next.length - 1];
    setInkColors(next);
    setToast(`Cor "${created.name}" criada.`);
    return created;
  }

  function handleRemoveSelected(ids: string[]) {
    setPrinters((current) => removePrinters(current, ids));
    setToast(`${ids.length} impressora(s) removida(s).`);
  }

  function handleSaveGroupQuantity(groupId: string, quantity: number) {
    setGroupQuantities((current) => saveGroupQuantity(current, groupId, quantity));
    setToast("Quantidade agrupada atualizada.");
  }

  function handleSaveGroupInk(groupId: string, colorId: string, quantity: number) {
    setGroupInkQuantities((current) => saveGroupInkQuantity(current, groupId, colorId, quantity));
    setToast("Quantidade de tinta atualizada.");
  }

  function handleToggleSupplyType(group: PrinterGroup) {
    const nextType = group.supplyType === "tinta" ? "toner" : "tinta";
    const ids = group.printers.map((printer) => printer.id);
    setPrinters((current) => setSupplyTypeForPrinters(current, ids, nextType));
    setToast(`Grupo alterado para ${nextType === "tinta" ? "Tinta" : "Toner"}.`);
  }

  function handleOpenSupplyEmail(group: PrinterGroup) {
    setEmailGroup(group);
    setEmailOpen(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGroupOrder((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return current;
      const next = arrayMove(current, oldIndex, newIndex);
      saveGroupOrder(next);
      return next;
    });
  }

  function handleExport() {
    const blob = new Blob([exportBackup(printers, inkColors, groupQuantities, groupInkQuantities)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "impressoras-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    setMenuAnchor(null);
    setToast("Backup exportado.");
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const imported = parseImport(text);
      setPrinters(replaceAll(imported.printers));
      if (imported.inkColors?.length) setInkColors(replaceInkColors(imported.inkColors));
      if (imported.groupQuantities) setGroupQuantities(replaceGroupQuantities(imported.groupQuantities));
      if (imported.groupInkQuantities) setGroupInkQuantities(replaceGroupInkQuantities(imported.groupInkQuantities));
      setToast(`Importado: ${imported.printers.length} impressora(s).`);
    } catch {
      setToast("Arquivo JSON inválido.");
    }
  }

  const appBackground =
    mode === "light"
      ? "radial-gradient(1200px 600px at 15% -10%, #e0e7ff 0%, transparent 55%), radial-gradient(1000px 500px at 100% 0%, #dbeafe 0%, transparent 50%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)"
      : "#121212";

  const ceramicBg = mode === "light" ? "rgba(255,255,255,0.55)" : "rgba(30,30,30,0.6)";
  const ceramicBorder = mode === "light" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.08)";

  return (
    <Box sx={{ minHeight: "100vh", background: appBackground, backgroundAttachment: "fixed" }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          bgcolor: ceramicBg,
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: "1px solid",
          borderColor: ceramicBorder,
          boxShadow: mode === "light"
            ? "0 4px 20px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.6)"
            : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component="img"
              src="/LogoGsa.png"
              alt="Granfinale"
              sx={{ height: 40, width: "auto", objectFit: "contain" }}
            />
            <Box sx={{ width: "1px", height: 32, bgcolor: "divider" }} />
            <Typography variant="h6" component="h1">Controle de Toners</Typography>
          </Box>
          <ToggleButtonGroup size="small" exclusive value={viewMode} onChange={handleViewModeChange}>
            <ToggleButton value="comfortable">
              <Tooltip title="Visualização detalhada">
                <ViewAgendaIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="compact">
              <Tooltip title="Visualização compacta">
                <ViewListIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true); }}>
            Nova impressora
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={() => setRemoveOpen(true)}>
            Remover impressoras
          </Button>
          <Tooltip title="Configurações">
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => { toggle(); setMenuAnchor(null); }}>
              <ListItemIcon>{mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}</ListItemIcon>
              <ListItemText>{mode === "light" ? "Tema escuro" : "Tema claro"}</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleExport}>
              <ListItemIcon><UploadIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Exportar backup (.json)</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { fileRef.current?.click(); setMenuAnchor(null); }}>
              <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Importar backup (.json)</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {criticalCount > 0 && (
          <Card sx={{ mb: 3, borderColor: "error.main" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, "&:last-child": { pb: 2 } }}>
              <Chip color="error" label={`${criticalCount} modelo(s) crítico(s)`} />
              <Typography variant="body2" color="text.secondary">
                Gere o e-mail de SC nos cartões em vermelho.
              </Typography>
            </CardContent>
          </Card>
        )}

        {ready && orderedGroups.length === 0 && (
          <Card><CardContent><Typography color="text.secondary">Nenhuma impressora cadastrada.</Typography></CardContent></Card>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={dragModifiers} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedGroups.map((group) => group.id)} strategy={verticalListSortingStrategy}>
            <Stack ref={listRef} spacing={viewMode === "compact" ? 1 : 3}>
              {orderedGroups.map((group) =>
                viewMode === "compact" ? (
                  <CompactGroupCard
                    key={group.id}
                    group={group}
                    onEditGroupQuantity={(g) => { setEditingGroup(g); setGroupQtyOpen(true); }}
                    onEditGroupInk={(g) => { setEditingGroup(g); setGroupInkOpen(true); }}
                    onToggleSupplyType={handleToggleSupplyType}
                    onOpenSupplyEmail={handleOpenSupplyEmail}
                  />
                ) : (
                  <SortableGroupCard
                    key={group.id}
                    group={group}
                    onEdit={(printer) => { setEditing(printer); setDialogOpen(true); }}
                    onEditGroupQuantity={(g) => { setEditingGroup(g); setGroupQtyOpen(true); }}
                    onEditGroupInk={(g) => { setEditingGroup(g); setGroupInkOpen(true); }}
                    onToggleSupplyType={handleToggleSupplyType}
                    onOpenSupplyEmail={handleOpenSupplyEmail}
                  />
                ),
              )}
            </Stack>
          </SortableContext>
        </DndContext>
      </Container>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImportFile(file);
          e.target.value = "";
        }}
      />

      <PrinterDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      <GroupQuantityDialog
        open={groupQtyOpen}
        group={editingGroup}
        onClose={() => { setGroupQtyOpen(false); setEditingGroup(null); }}
        onSave={handleSaveGroupQuantity}
      />

      <GroupInkDialog
        open={groupInkOpen}
        group={editingGroup}
        inkColors={inkColors}
        inkQuantities={editingGroup?.inkQuantities ?? {}}
        onClose={() => { setGroupInkOpen(false); setEditingGroup(null); }}
        onSave={handleSaveGroupInk}
        onCreateInkColor={handleCreateInkColor}
      />

      <SupplyEmailDialog
        open={emailOpen}
        group={emailGroup}
        inkColors={inkColors}
        onClose={() => { setEmailOpen(false); setEmailGroup(null); }}
      />

      <RemovePrintersDialog
        open={removeOpen}
        printers={printers}
        onClose={() => setRemoveOpen(false)}
        onRemove={handleRemoveSelected}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            bgcolor: "#111827",
            color: "#f8fafc",
            minWidth: "auto",
            px: 2,
            py: 0.75,
            borderRadius: 2,
            justifyContent: "center",
            textAlign: "center",
          },
          "& .MuiSnackbarContent-message": {
            width: "100%",
            textAlign: "center",
          },
        }}
      />
    </Box>
  );
}
