import { useState } from "react";
import { useListPrescriptions, useCreatePrescription, getListPrescriptionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Stethoscope, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700 border-amber-200",
  dispensada: "bg-green-100 text-green-700 border-green-200",
  vencida: "bg-red-100 text-red-700 border-red-200",
  cancelada: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  dispensada: "Dispensada",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

interface PrescriptionForm {
  customerId: string;
  doctorName: string;
  doctorCrm: string;
  prescriptionDate: string;
  expirationDate: string;
  notes: string;
  medicationName: string;
  medicationQty: number;
  productId: number;
  dosageInstructions: string;
}

export default function Receitas() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: prescriptions, isLoading } = useListPrescriptions();
  const createPrescription = useCreatePrescription();

  const { register, handleSubmit, reset } = useForm<PrescriptionForm>({
    defaultValues: { medicationQty: 1 },
  });

  const onSubmit = (data: PrescriptionForm) => {
    createPrescription.mutate({
      data: {
        customerId: data.customerId ? Number(data.customerId) : null,
        doctorName: data.doctorName,
        doctorCrm: data.doctorCrm,
        prescriptionDate: data.prescriptionDate,
        expirationDate: data.expirationDate || null,
        items: [{ productId: Number(data.productId), productName: data.medicationName, quantity: Number(data.medicationQty), dosageInstructions: data.dosageInstructions || null }],
        notes: data.notes || null,
      },
    }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListPrescriptionsQueryKey() }); setOpen(false); reset(); toast({ title: "Receita registrada" }); },
      onError: () => toast({ title: "Erro ao registrar receita", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Receitas Médicas</h2>
          <p className="text-muted-foreground text-sm">Registro e controle de receitas</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-new-prescription">
          <Plus className="h-4 w-4 mr-2" /> Nova Receita
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {prescriptions?.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-secondary/30 transition-colors gap-3" data-testid={`row-prescription-${p.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-lg p-2 mt-0.5">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{p.customerName || "Cliente não identificado"}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" /> Dr. {p.doctorName} — CRM {p.doctorCrm}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(p.prescriptionDate).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {Array.isArray(p.items) && p.items.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{p.items.length} medicamento(s)</p>
                      )}
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}>{STATUS_LABELS[p.status] ?? p.status}</Badge>
                </div>
              ))}
              {(!prescriptions || prescriptions.length === 0) && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  Nenhuma receita registrada.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Receita</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Médico *</Label>
                <Input {...register("doctorName", { required: true })} placeholder="Dr. Nome" data-testid="input-doctor-name" />
              </div>
              <div className="space-y-2">
                <Label>CRM *</Label>
                <Input {...register("doctorCrm", { required: true })} placeholder="CRM/SP 000000" data-testid="input-doctor-crm" />
              </div>
              <div className="space-y-2">
                <Label>Data da Receita *</Label>
                <Input type="date" {...register("prescriptionDate", { required: true })} data-testid="input-prescription-date" />
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input type="date" {...register("expirationDate")} />
              </div>
              <div className="space-y-2">
                <Label>ID do Cliente (opcional)</Label>
                <Input type="number" {...register("customerId")} placeholder="ID do cliente" />
              </div>
              <div className="space-y-2">
                <Label>ID do Produto *</Label>
                <Input type="number" {...register("productId", { required: true })} placeholder="ID do produto" data-testid="input-prescription-product" />
              </div>
              <div className="space-y-2">
                <Label>Nome do Medicamento *</Label>
                <Input {...register("medicationName", { required: true })} placeholder="Nome do medicamento" />
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" {...register("medicationQty", { required: true })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Posologia</Label>
                <Input {...register("dosageInstructions")} placeholder="ex: 1 comprimido 2x ao dia" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <Textarea {...register("notes")} placeholder="Observações adicionais" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createPrescription.isPending} data-testid="button-save-prescription">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
