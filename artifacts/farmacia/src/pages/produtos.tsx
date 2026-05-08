import { useState } from "react";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey, Product } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";

const CATEGORIES = ["Medicamentos", "Dermocosméticos", "Higiene", "Perfumaria", "Genéricos", "OTC", "Suplementos", "Bebê", "Veterinário"];

interface ProductForm {
  name: string;
  genericName: string;
  barcode: string;
  category: string;
  manufacturer: string;
  dosage: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  isControlled: boolean;
  anvisaCode: string;
  requiresPrescription: boolean;
}

export default function Produtos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const { data: products, isLoading } = useListProducts({ q: search || undefined, category: categoryFilter !== "all" ? categoryFilter : undefined });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductForm>({
    defaultValues: { unit: "un", isControlled: false, requiresPrescription: false, minStock: 10, costPrice: 0, salePrice: 0 },
  });

  const isControlled = watch("isControlled");
  const requiresPrescription = watch("requiresPrescription");

  const openCreate = () => {
    setEditing(null);
    reset({ unit: "un", isControlled: false, requiresPrescription: false, minStock: 10, costPrice: 0, salePrice: 0 });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p.id);
    reset({
      name: p.name, genericName: p.genericName ?? "", barcode: p.barcode ?? "",
      category: p.category, manufacturer: p.manufacturer ?? "", dosage: p.dosage ?? "",
      unit: p.unit, costPrice: p.costPrice, salePrice: p.salePrice, minStock: p.minStock,
      isControlled: p.isControlled, anvisaCode: p.anvisaCode ?? "", requiresPrescription: p.requiresPrescription,
    });
    setOpen(true);
  };

  const onSubmit = (data: ProductForm) => {
    const payload = { ...data, costPrice: Number(data.costPrice), salePrice: Number(data.salePrice), minStock: Number(data.minStock) };
    if (editing) {
      updateProduct.mutate({ id: editing, data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); toast({ title: "Produto atualizado" }); },
        onError: () => toast({ title: "Erro ao atualizar produto", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); setOpen(false); toast({ title: "Produto cadastrado" }); },
        onError: () => toast({ title: "Erro ao cadastrar produto", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir produto?")) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProductsQueryKey() }); toast({ title: "Produto excluído" }); },
      onError: () => toast({ title: "Erro ao excluir produto", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
          <p className="text-muted-foreground text-sm">Catálogo completo de produtos</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90" data-testid="button-new-product">
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, código de barras..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-product" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
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
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Produto</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Categoria</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Código</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Preço</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Estoque</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {products?.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-product-${p.id}`}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{p.name}</div>
                        {p.genericName && <div className="text-xs text-muted-foreground">{p.genericName}</div>}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">{p.barcode || "—"}</td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                        R$ {p.salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={p.currentStock <= p.minStock ? "text-destructive font-semibold" : "text-foreground"}>
                          {p.currentStock <= p.minStock && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {p.isControlled && <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs"><ShieldAlert className="h-3 w-3 mr-1" />Controlado</Badge>}
                          {p.requiresPrescription && !p.isControlled && <Badge variant="outline" className="text-xs">Receita</Badge>}
                          {!p.isControlled && !p.requiresPrescription && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Livre</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} data-testid={`button-delete-product-${p.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!products || products.length === 0) && (
                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome do Produto *</Label>
                <Input {...register("name", { required: true })} placeholder="Nome comercial" data-testid="input-product-name" />
              </div>
              <div className="space-y-2">
                <Label>Nome Genérico</Label>
                <Input {...register("genericName")} placeholder="Princípio ativo" />
              </div>
              <div className="space-y-2">
                <Label>Código de Barras</Label>
                <Input {...register("barcode")} placeholder="EAN-13" data-testid="input-product-barcode" />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select onValueChange={(v) => setValue("category", v)} defaultValue="Medicamentos">
                  <SelectTrigger data-testid="select-product-category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fabricante</Label>
                <Input {...register("manufacturer")} placeholder="Laboratório" />
              </div>
              <div className="space-y-2">
                <Label>Dosagem</Label>
                <Input {...register("dosage")} placeholder="ex: 500mg" />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select onValueChange={(v) => setValue("unit", v)} defaultValue="un">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["un", "cx", "fr", "bl", "amp", "g", "ml"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço de Custo (R$) *</Label>
                <Input type="number" step="0.01" {...register("costPrice", { required: true })} data-testid="input-product-cost" />
              </div>
              <div className="space-y-2">
                <Label>Preço de Venda (R$) *</Label>
                <Input type="number" step="0.01" {...register("salePrice", { required: true })} data-testid="input-product-price" />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input type="number" {...register("minStock")} />
              </div>
              <div className="col-span-2 flex items-center justify-between p-4 rounded-lg border bg-secondary/30">
                <div>
                  <p className="font-medium text-sm">Medicamento Controlado</p>
                  <p className="text-xs text-muted-foreground">Sujeito a controle ANVISA</p>
                </div>
                <Switch checked={isControlled} onCheckedChange={(v) => setValue("isControlled", v)} data-testid="switch-controlled" />
              </div>
              {isControlled && (
                <div className="col-span-2 space-y-2">
                  <Label>Código ANVISA</Label>
                  <Input {...register("anvisaCode")} placeholder="Número de registro" />
                </div>
              )}
              <div className="col-span-2 flex items-center justify-between p-4 rounded-lg border bg-secondary/30">
                <div>
                  <p className="font-medium text-sm">Exige Receita Médica</p>
                  <p className="text-xs text-muted-foreground">Obrigatório na venda</p>
                </div>
                <Switch checked={requiresPrescription} onCheckedChange={(v) => setValue("requiresPrescription", v)} data-testid="switch-prescription" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createProduct.isPending || updateProduct.isPending} data-testid="button-save-product">
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
