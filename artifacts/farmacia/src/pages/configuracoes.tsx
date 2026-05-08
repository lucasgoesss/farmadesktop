import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Store, FileText, Printer, Shield, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Configuracoes() {
  const { toast } = useToast();
  const [pharmacyName, setPharmacyName] = useState("Farmácia Central");
  const [cnpj, setCnpj] = useState("00.000.000/0001-00");
  const [license, setLicense] = useState("CRF/SP 0000000");
  const [address, setAddress] = useState("Rua das Flores, 123 - Centro - São Paulo/SP");
  const [phone, setPhone] = useState("(11) 3000-0000");
  const [email, setEmail] = useState("contato@farmaciacentral.com.br");
  const [pharmacist, setPharmacist] = useState("Dr. João Silva - CRF/SP 000000");

  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [notifyAnvisa, setNotifyAnvisa] = useState(true);

  const handleSave = () => {
    toast({ title: "Configurações salvas com sucesso!" });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
        <p className="text-muted-foreground text-sm">Configurações gerais do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-5 w-5 text-primary" /> Dados da Farmácia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome da Farmácia</Label>
              <Input value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} data-testid="input-pharmacy-name" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} data-testid="input-pharmacy-cnpj" />
            </div>
            <div className="space-y-2">
              <Label>Alvará / Licença CRF</Label>
              <Input value={license} onChange={(e) => setLicense(e.target.value)} data-testid="input-pharmacy-license" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Endereço</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Farmacêutico Responsável</Label>
              <Input value={pharmacist} onChange={(e) => setPharmacist(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" /> Alertas e Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Alertas de Estoque Baixo", desc: "Notificar quando estoque atingir mínimo", value: notifyLowStock, set: setNotifyLowStock, testId: "switch-notify-stock" },
            { label: "Alertas de Vencimento", desc: "Notificar produtos com validade próxima", value: notifyExpiry, set: setNotifyExpiry, testId: "switch-notify-expiry" },
            { label: "Alertas ANVISA", desc: "Notificar sobre medicamentos controlados em estoque baixo", value: notifyAnvisa, set: setNotifyAnvisa, testId: "switch-notify-anvisa" },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch checked={n.value} onCheckedChange={n.set} data-testid={n.testId} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" /> Integrações (Em breve)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {["NF-e / SAT", "TEF — Cartão", "Impressora Térmica", "Leitor de Código de Barras"].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                <span className="text-sm font-medium">{item}</span>
                <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">Em breve</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 gap-2" data-testid="button-save-settings">
          <Save className="h-4 w-4" /> Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
