import { useState } from "react";
import { useListControlledDispensations, useCreateControlledDispensation, getListControlledDispensationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";

const ANVISA_CLASSES = ["A1", "A2", "A3", "B1", "B2", "C1", "C2", "C3", "C4", "C5", "D1", "D2", "E"];

interface DispensationForm {
  customerId: number;
  productId: number;
  prescriptionId: string;
  quantity: number;
  anvisaClass: string;
  notificationNumber: string;
  retentionRequired: boolean;
  retained: boolean;
}

export default function Controlados() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: dispensations, isLoading } = useListControlledDispensations();
  const createDispensation = useCreateControlledDispensation();

  const { register, handleSubmit, reset, setValue, watch } = useForm<DispensationForm>({
    defaultValues: { quantity: 1, retentionRequired: true, retained: false, anvisaClass: "C1" },
  });

  const retentionRequired = watch("retentionRequired");
  const retained = watch("retained");

  const onSubmit = (data: DispensationForm) => {
    createDispensation.mutate({
      data: {
        customerId: Number(data.customerId),
        productId: Number(data.productId),
        prescriptionId: data.prescriptionId ? Number(data.prescriptionId) : null,
        quantity: Number(data.quantity),
        anvisaClass: data.anvisaClass,
        notificationNumber: data.notificationNumber || null,
        retentionRequired: data.retentionRequired,
        retained: data.retained,
      },
    }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListControlledDispensationsQueryKey() }); setOpen(false); reset(); toast({ title: "Dispensação registrada" }); },
      onError: () => toast({ title: "Erro ao registrar dispensação", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Medicamentos Controlados</h2>
          <p className="text-muted-foreground text-sm">Controle conforme legislação ANVISA</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-new-dispensation">
          <Plus className="h-4 w-4 mr-2" /> Nova Dispensação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{dispensations?.length ?? 0}</p>
                <p className="text-sm text-orange-600">Total dispensações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{dispensations?.filter((d) => d.retentionRequired && !d.retained).length ?? 0}</p>
                <p className="text-sm text-amber-600">Retenção pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{dispensations?.filter((d) => d.retained).length ?? 0}</p>
                <p className="text-sm text-green-600">Receitas retidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Paciente</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Medicamento</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Classe</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Qtd</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Retenção</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Dispensado por</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {dispensations?.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-dispensation-${d.id}`}>
                      <td className="py-3 px-4">
                        <p className="font-medium">{d.customerName}</p>
                        <p className="text-xs text-muted-foreground">{d.customerCpf}</p>
                      </td>
                      <td className="py-3 px-4 font-medium">{d.productName}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">{d.anvisaClass}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">{d.quantity}</td>
                      <td className="py-3 px-4 text-center">
                        {d.retentionRequired ? (
                          d.retained
                            ? <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Retida</Badge>
                            : <Badge className="bg-red-100 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Pendente</Badge>
                        ) : <Badge variant="outline">Não exigida</Badge>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{d.dispensedBy}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(d.createdAt).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                  {(!dispensations || dispensations.length === 0) && (
                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nenhuma dispensação registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Dispensação de Controlado</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID do Cliente *</Label>
                <Input type="number" {...register("customerId", { required: true })} data-testid="input-dispensation-customer" />
              </div>
              <div className="space-y-2">
                <Label>ID do Produto *</Label>
                <Input type="number" {...register("productId", { required: true })} data-testid="input-dispensation-product" />
              </div>
              <div className="space-y-2">
                <Label>Classe ANVISA *</Label>
                <Select defaultValue="C1" onValueChange={(v) => setValue("anvisaClass", v)}>
                  <SelectTrigger data-testid="select-anvisa-class"><SelectValue /></SelectTrigger>
                  <SelectContent>{ANVISA_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" {...register("quantity", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Nº da Receita/Notificação</Label>
                <Input {...register("notificationNumber")} placeholder="Número" />
              </div>
              <div className="space-y-2">
                <Label>ID da Receita</Label>
                <Input type="number" {...register("prescriptionId")} />
              </div>
              <div className="col-span-2 flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Exige Retenção de Receita</p>
                  <p className="text-xs text-muted-foreground">Obrigatório por lei para esta classe</p>
                </div>
                <Switch checked={retentionRequired} onCheckedChange={(v) => setValue("retentionRequired", v)} data-testid="switch-retention-required" />
              </div>
              {retentionRequired && (
                <div className="col-span-2 flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                  <div>
                    <p className="font-medium text-sm">Receita Retida</p>
                    <p className="text-xs text-muted-foreground">Confirmação de retenção física</p>
                  </div>
                  <Switch checked={retained} onCheckedChange={(v) => setValue("retained", v)} data-testid="switch-retained" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createDispensation.isPending} data-testid="button-save-dispensation">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
