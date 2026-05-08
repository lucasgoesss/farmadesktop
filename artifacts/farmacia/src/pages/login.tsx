import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Shield } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@farmasystem.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLocation("/");
    }, 800);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #B71C1C 0%, #C62828 40%, #7f1d1d 100%)" }}>
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 p-12 text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 rounded-xl p-3">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">FarmaSystem</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Gestão completa<br />para sua farmácia
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Sistema integrado de PDV, estoque, medicamentos controlados, financeiro e muito mais. Tudo em um só lugar.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "PDV Rápido", desc: "Atendimento ágil" },
              { label: "ANVISA", desc: "Controlados em dia" },
              { label: "Estoque", desc: "Sem rupturas" },
              { label: "Financeiro", desc: "Fluxo de caixa" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-lg p-4">
                <p className="font-semibold">{f.label}</p>
                <p className="text-white/70 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-md flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <div className="flex items-center gap-2 justify-center lg:justify-start mb-6 lg:mb-0">
              <div className="bg-red-700 rounded-lg p-2 lg:hidden">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-red-700 lg:hidden">FarmaSystem</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Bem-vindo de volta</h2>
            <p className="text-gray-500 mt-1">Entre com suas credenciais para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus-visible:ring-red-600"
                  placeholder="seu@email.com"
                  data-testid="input-email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus-visible:ring-red-600"
                  placeholder="••••••••"
                  data-testid="input-password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-red-700 hover:bg-red-800 text-white font-semibold"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? "Entrando..." : "Entrar no sistema"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            FarmaSystem v2.0 — Sistema de Gestão Farmacêutica
          </p>
        </div>
      </div>
    </div>
  );
}
