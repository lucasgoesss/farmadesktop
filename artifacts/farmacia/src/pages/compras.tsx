import { useState } from "react";
import { useListPurchases, useCreatePurchase, useUpdatePurchase, getListPurchasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShoppingBag, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pendente: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Pendente" },
  confirmado: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: ShoppingBag, label: "Confirmado" },
  recebido: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle, label: "Recebido" },
  cancelado: { color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle, label: "Cancelado" },
};

interface PurchaseForm {
  supplierId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  expectedDate: string;
  notes: string;
}

export default function Compras() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: purchases, isLoading } = useListPurchases();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();

  const { register, handleSubmit, reset } = useForm<PurchaseForm>({ defaultValues: { quantity: 1, unitCost: 0 } });

  const onSubmit = (data: PurchaseForm) => {
    const qty = Number(data.quantity);
    const cost = Number(data.unitCost);
    createPurchase.mutate({
      data: {
        supplierId: Number(data.supplierId),
        items: [{ productId: Number(data.productId), productName: data.productName, quantity: qty, unitCost: cost, total: qty * cost }],
        expectedDate: data.expectedDate || null,
        notes: data.notes || null,
      },
    }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPurchasesQueryKey() }); setOpen(false); reset(); toast({ title: "Pedido criado" }); },
      onError: () => toast({ title: "Erro ao criar pedido", variant: "destructive" }),
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    setUpdatingId(id);
    updatePurchase.mutate({ id, data: { status: status as "pendente" | "confirmado" | "recebido" | "cancelado" } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPurchasesQueryKey() }); setUpdatingId(null); toast({ title: "Status atualizado" }); },
      onError: () => { setUpdatingId(null); toast({ title: "Erro ao atualizar status", variant: "destructive" }); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Compras</h2>
          <p className="text-muted-foreground text-sm">Pedidos de compra com fornecedores</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-new-purchase">
          <Plus className="h-4 w-4 mr-2" /> Novo Pedido
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Fornecedor</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Total</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Previsão</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Data</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {purchases?.map((p) => {
                    const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pendente;
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-purchase-${p.id}`}>
                        <td className="py-3 px-4 text-muted-foreground font-mono">#{p.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{p.supplierName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">R$ {p.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                          {p.expectedDate ? new Date(p.expectedDate).toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3 px-4">
                          {p.status === "pendente" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(p.id, "confirmado")} disabled={updatingId === p.id}>Confirmar</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-destructive hover:text-destructive" onClick={() => handleStatusChange(p.id, "cancelado")} disabled={updatingId === p.id}>Cancelar</Button>
                            </div>
                          )}
                          {p.status === "confirmado" && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-300 hover:bg-green-50" onClick={() => handleStatusChange(p.id, "recebido")} disabled={updatingId === p.id}>Marcar Recebido</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!purchases || purchases.length === 0) && (
                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nenhum pedido de compra.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pedido de Compra</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>ID do Fornecedor *</Label>
                <Input type="number" {...register("supplierId", { required: true })} placeholder="ID do fornecedor" data-testid="input-purchase-supplier" />
              </div>
              <div className="space-y-2">
                <Label>ID do Produto *</Label>
                <Input type="number" {...register("productId", { required: true })} data-testid="input-purchase-product" />
              </div>
              <div className="space-y-2">
                <Label>Nome do Produto *</Label>
                <Input {...register("productName", { required: true })} placeholder="Nome para referência" />
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" {...register("quantity", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Custo Unitário (R$) *</Label>
                <Input type="number" step="0.01" {...register("unitCost", { required: true })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Previsão de Entrega</Label>
                <Input type="date" {...register("expectedDate")} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Input {...register("notes")} placeholder="Informações adicionais" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createPurchase.isPending} data-testid="button-save-purchase">Criar Pedido</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
