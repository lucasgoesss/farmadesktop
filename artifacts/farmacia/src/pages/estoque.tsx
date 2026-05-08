import { useState } from "react";
import { useListStock, useCreateStockEntry, useListStockMovements, getListStockQueryKey, getListStockMovementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertTriangle, Package, ArrowDownCircle, ArrowUpCircle, RefreshCcw } from "lucide-react";
import { useForm } from "react-hook-form";

const getDaysUntilExpiry = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const ExpiryBadge = ({ date }: { date: string }) => {
  const days = getDaysUntilExpiry(date);
  if (days < 0) return <Badge className="bg-red-100 text-red-700 border-red-200">Vencido</Badge>;
  if (days <= 30) return <Badge className="bg-red-100 text-red-700 border-red-200">{days}d</Badge>;
  if (days <= 90) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{days}d</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-green-200">{new Date(date).toLocaleDateString("pt-BR")}</Badge>;
};

interface EntryForm {
  productId: number;
  lotNumber: string;
  quantity: number;
  expirationDate: string;
  supplierId: string;
  costPrice: number;
}

export default function Estoque() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: lots, isLoading } = useListStock();
  const { data: movements } = useListStockMovements({});
  const createEntry = useCreateStockEntry();

  const { register, handleSubmit, reset } = useForm<EntryForm>({
    defaultValues: { quantity: 1, costPrice: 0 },
  });

  const onSubmit = (data: EntryForm) => {
    createEntry.mutate({
      data: {
        productId: Number(data.productId),
        lotNumber: data.lotNumber,
        quantity: Number(data.quantity),
        expirationDate: data.expirationDate,
        supplierId: data.supplierId ? Number(data.supplierId) : null,
        costPrice: Number(data.costPrice),
      },
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListStockQueryKey() });
        qc.invalidateQueries({ queryKey: getListStockMovementsQueryKey({}) });
        setOpen(false);
        reset();
        toast({ title: "Entrada registrada com sucesso!" });
      },
      onError: () => toast({ title: "Erro ao registrar entrada", variant: "destructive" }),
    });
  };

  const movementIcon = (type: string) => {
    if (type === "entrada") return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
    if (type === "saida") return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
    return <RefreshCcw className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estoque</h2>
          <p className="text-muted-foreground text-sm">Controle de lotes e movimentações</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90" data-testid="button-new-entry">
          <Plus className="h-4 w-4 mr-2" /> Entrada de Mercadoria
        </Button>
      </div>

      <Tabs defaultValue="lotes">
        <TabsList>
          <TabsTrigger value="lotes">Lotes</TabsTrigger>
          <TabsTrigger value="movimentos">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="lotes">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Produto</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Lote</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Qtd</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Validade</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Fornecedor</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots?.map((lot) => (
                        <tr key={lot.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-lot-${lot.id}`}>
                          <td className="py-3 px-4 font-medium">{lot.productName}</td>
                          <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{lot.lotNumber}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={lot.quantity <= 5 ? "text-destructive font-bold" : "font-semibold"}>
                              {lot.quantity <= 5 && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                              {lot.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4"><ExpiryBadge date={lot.expirationDate} /></td>
                          <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{lot.supplierName || "—"}</td>
                          <td className="py-3 px-4 text-right hidden md:table-cell">R$ {lot.costPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {(!lots || lots.length === 0) && (
                        <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          Nenhum lote encontrado.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentos">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Produto</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Qtd</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Motivo</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Usuário</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements?.map((m) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-movement-${m.id}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {movementIcon(m.type)}
                            <span className="capitalize text-xs font-medium">{m.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{m.productName}</td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={m.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {m.quantity > 0 ? "+" : ""}{m.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{m.reason || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{m.userName}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(m.createdAt).toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                    {(!movements || movements.length === 0) && (
                      <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Nenhuma movimentação encontrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrada de Mercadoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>ID do Produto *</Label>
                <Input type="number" {...register("productId", { required: true })} placeholder="ID do produto" data-testid="input-entry-product" />
              </div>
              <div className="space-y-2">
                <Label>Número do Lote *</Label>
                <Input {...register("lotNumber", { required: true })} placeholder="ex: LOT-2025-001" data-testid="input-lot-number" />
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" {...register("quantity", { required: true })} data-testid="input-entry-qty" />
              </div>
              <div className="space-y-2">
                <Label>Data de Validade *</Label>
                <Input type="date" {...register("expirationDate", { required: true })} data-testid="input-expiry-date" />
              </div>
              <div className="space-y-2">
                <Label>Custo Unitário (R$)</Label>
                <Input type="number" step="0.01" {...register("costPrice")} data-testid="input-entry-cost" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>ID do Fornecedor (opcional)</Label>
                <Input type="number" {...register("supplierId")} placeholder="ID do fornecedor" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createEntry.isPending} data-testid="button-save-entry">Registrar Entrada</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
