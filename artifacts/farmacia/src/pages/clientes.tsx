import { useState } from "react";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useGetCustomerSales, getListCustomersQueryKey, getGetCustomerSalesQueryKey, Customer } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Star, User, ShoppingBag, X } from "lucide-react";
import { useForm } from "react-hook-form";

interface CustomerForm {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
}

function CustomerDetail({ customerId, onClose }: { customerId: number; onClose: () => void }) {
  const { data: sales, isLoading } = useGetCustomerSales(customerId, { query: { queryKey: getGetCustomerSalesQueryKey(customerId) } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> Histórico de Compras</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      {isLoading ? <Skeleton className="h-32 w-full" /> : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sales?.map((s) => (
            <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border bg-secondary/20">
              <div>
                <p className="font-medium text-sm">Venda #{s.id}</p>
                <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("pt-BR")} · {s.paymentMethod}</p>
              </div>
              <span className="font-bold text-primary">R$ {s.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          {(!sales || sales.length === 0) && <p className="text-muted-foreground text-center py-6">Nenhuma compra registrada.</p>}
        </div>
      )}
    </div>
  );
}

export default function Clientes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: customers, isLoading } = useListCustomers({ q: search || undefined });
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const { register, handleSubmit, reset } = useForm<CustomerForm>();

  const openCreate = () => { setEditing(null); reset(); setOpen(true); };
  const openEdit = (c: Customer) => {
    setEditing(c.id);
    reset({ name: c.name, cpf: c.cpf ?? "", email: c.email ?? "", phone: c.phone ?? "", birthDate: c.birthDate ?? "", address: c.address ?? "" });
    setOpen(true);
  };

  const onSubmit = (data: CustomerForm) => {
    const payload = { name: data.name, cpf: data.cpf || null, email: data.email || null, phone: data.phone || null, birthDate: data.birthDate || null, address: data.address || null };
    if (editing) {
      updateCustomer.mutate({ id: editing, data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setOpen(false); toast({ title: "Cliente atualizado" }); },
        onError: () => toast({ title: "Erro ao atualizar cliente", variant: "destructive" }),
      });
    } else {
      createCustomer.mutate({ data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); setOpen(false); toast({ title: "Cliente cadastrado" }); },
        onError: () => toast({ title: "Erro ao cadastrar cliente", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir cliente?")) return;
    deleteCustomer.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListCustomersQueryKey() }); toast({ title: "Cliente excluído" }); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clientes</h2>
          <p className="text-muted-foreground text-sm">Cadastro e histórico de clientes</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90" data-testid="button-new-customer">
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, CPF, telefone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-customer" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">CPF</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Telefone</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Total Compras</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Pontos</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {customers?.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-customer-${c.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full p-2"><User className="h-4 w-4 text-primary" /></div>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{c.cpf || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{c.phone || "—"}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        R$ {c.totalPurchases.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{c.loyaltyPoints}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDetailId(c.id)} data-testid={`button-history-${c.id}`}>Histórico</Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} data-testid={`button-edit-customer-${c.id}`}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)} data-testid={`button-delete-customer-${c.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!customers || customers.length === 0) && (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {detailId && (
        <Card>
          <CardContent className="pt-6">
            <CustomerDetail customerId={detailId} onClose={() => setDetailId(null)} />
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome *</Label>
                <Input {...register("name", { required: true })} placeholder="Nome completo" data-testid="input-customer-name" />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input {...register("cpf")} placeholder="000.000.000-00" data-testid="input-customer-cpf" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register("phone")} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" {...register("email")} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input type="date" {...register("birthDate")} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input {...register("address")} placeholder="Rua, número, bairro, cidade" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createCustomer.isPending || updateCustomer.isPending} data-testid="button-save-customer">
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
