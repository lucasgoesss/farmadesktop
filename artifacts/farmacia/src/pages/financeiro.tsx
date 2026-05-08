import { useState } from "react";
import {
  useGetFinancialCashflow, useListFinancialTransactions, useCreateFinancialTransaction,
  useListAccountsPayable, useListAccountsReceivable,
  getListFinancialTransactionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700 border-amber-200",
  pago: "bg-green-100 text-green-700 border-green-200",
  vencido: "bg-red-100 text-red-700 border-red-200",
  cancelado: "bg-gray-100 text-gray-600 border-gray-200",
};

interface TxForm {
  type: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string;
}

function TxTable({ data, isLoading }: { data: any[] | undefined; isLoading: boolean }) {
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Descrição</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Categoria</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Valor</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Vencimento</th>
            <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((t) => (
            <tr key={t.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-transaction-${t.id}`}>
              <td className="py-3 px-4 font-medium">{t.description}</td>
              <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{t.category}</td>
              <td className="py-3 px-4 text-right">
                <span className={t.type === "receita" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {t.type === "receita" ? "+" : "-"}R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(t.dueDate).toLocaleDateString("pt-BR")}</td>
              <td className="py-3 px-4 text-center">
                <Badge className={STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}>{t.status}</Badge>
              </td>
            </tr>
          ))}
          {(!data || data.length === 0) && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Nenhum lançamento encontrado.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function Financeiro() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: cashflow, isLoading: loadingCashflow } = useGetFinancialCashflow();
  const { data: transactions, isLoading: loadingTx } = useListFinancialTransactions();
  const { data: payable, isLoading: loadingPayable } = useListAccountsPayable();
  const { data: receivable, isLoading: loadingReceivable } = useListAccountsReceivable();
  const createTx = useCreateFinancialTransaction();

  const { register, handleSubmit, reset, setValue } = useForm<TxForm>({ defaultValues: { type: "despesa" } });

  const onSubmit = (data: TxForm) => {
    createTx.mutate({
      data: { type: data.type as "receita" | "despesa", category: data.category, description: data.description, amount: Number(data.amount), dueDate: data.dueDate },
    }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListFinancialTransactionsQueryKey() }); setOpen(false); reset(); toast({ title: "Lançamento criado" }); },
      onError: () => toast({ title: "Erro ao criar lançamento", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
          <p className="text-muted-foreground text-sm">Fluxo de caixa e controle financeiro</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-new-transaction">
          <Plus className="h-4 w-4 mr-2" /> Novo Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Saldo", value: cashflow?.balance, icon: DollarSign, color: (cashflow?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600", bg: "bg-white" },
          { label: "A Receber", value: cashflow?.totalReceivable, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 border-green-100" },
          { label: "A Pagar", value: cashflow?.totalPayable, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          { label: "Vencidos (Pagar)", value: cashflow?.overduePayable, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
        ].map((kpi) => (
          <Card key={kpi.label} className={kpi.bg}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              {loadingCashflow ? <Skeleton className="h-8 w-28" /> : (
                <p className={`text-2xl font-bold ${kpi.color}`}>
                  R$ {(kpi.value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="receber">A Receber</TabsTrigger>
          <TabsTrigger value="pagar">A Pagar</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">
          <Card><CardContent className="pt-6"><TxTable data={transactions} isLoading={loadingTx} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="receber">
          <Card><CardContent className="pt-6"><TxTable data={receivable} isLoading={loadingReceivable} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="pagar">
          <Card><CardContent className="pt-6"><TxTable data={payable} isLoading={loadingPayable} /></CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select defaultValue="despesa" onValueChange={(v) => setValue("type", v)}>
                  <SelectTrigger data-testid="select-tx-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Input {...register("category", { required: true })} placeholder="ex: Fornecedores" data-testid="input-tx-category" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descrição *</Label>
                <Input {...register("description", { required: true })} placeholder="Descrição do lançamento" data-testid="input-tx-description" />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" {...register("amount", { required: true })} data-testid="input-tx-amount" />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input type="date" {...register("dueDate", { required: true })} data-testid="input-tx-due-date" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createTx.isPending} data-testid="button-save-transaction">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
