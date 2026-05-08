import { useState } from "react";
import { useListSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, getListSuppliersQueryKey, Supplier } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Truck, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";

interface SupplierForm {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  contact: string;
  address: string;
}

export default function Fornecedores() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const { data: suppliers, isLoading } = useListSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const { register, handleSubmit, reset } = useForm<SupplierForm>();

  const openCreate = () => { setEditing(null); reset(); setOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s.id);
    reset({ name: s.name, cnpj: s.cnpj ?? "", email: s.email ?? "", phone: s.phone ?? "", contact: s.contact ?? "", address: s.address ?? "" });
    setOpen(true);
  };

  const onSubmit = (data: SupplierForm) => {
    const payload = { name: data.name, cnpj: data.cnpj || null, email: data.email || null, phone: data.phone || null, contact: data.contact || null, address: data.address || null };
    if (editing) {
      updateSupplier.mutate({ id: editing, data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); setOpen(false); toast({ title: "Fornecedor atualizado" }); },
        onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
      });
    } else {
      createSupplier.mutate({ data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); setOpen(false); toast({ title: "Fornecedor cadastrado" }); },
        onError: () => toast({ title: "Erro ao cadastrar", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir fornecedor?")) return;
    deleteSupplier.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() }); toast({ title: "Fornecedor excluído" }); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fornecedores</h2>
          <p className="text-muted-foreground text-sm">Gestão de fornecedores e distribuidores</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90" data-testid="button-new-supplier">
          <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />) : (
          suppliers?.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow" data-testid={`card-supplier-${s.id}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><Truck className="h-5 w-5 text-primary" /></div>
                    <span className="text-base">{s.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} data-testid={`button-edit-supplier-${s.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)} data-testid={`button-delete-supplier-${s.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {s.cnpj && <p className="text-muted-foreground">CNPJ: <span className="text-foreground">{s.cnpj}</span></p>}
                {s.contact && <p className="text-muted-foreground">Contato: <span className="text-foreground">{s.contact}</span></p>}
                {s.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /><span className="text-foreground">{s.email}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /><span className="text-foreground">{s.phone}</span>
                  </div>
                )}
                {s.address && <p className="text-muted-foreground text-xs">{s.address}</p>}
              </CardContent>
            </Card>
          ))
        )}
        {(!isLoading && (!suppliers || suppliers.length === 0)) && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">Nenhum fornecedor cadastrado.</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Razão Social / Nome *</Label>
                <Input {...register("name", { required: true })} data-testid="input-supplier-name" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label>Representante</Label>
                <Input {...register("contact")} placeholder="Nome do contato" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register("phone")} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input {...register("address")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createSupplier.isPending || updateSupplier.isPending} data-testid="button-save-supplier">
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
