import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/pdv": "PDV / Vendas",
  "/estoque": "Estoque",
  "/produtos": "Produtos",
  "/clientes": "Clientes",
  "/fornecedores": "Fornecedores",
  "/receitas": "Receitas",
  "/controlados": "Medicamentos Controlados",
  "/compras": "Compras",
  "/financeiro": "Financeiro",
  "/relatorios": "Relatórios",
  "/usuarios": "Administração / Usuários",
  "/configuracoes": "Configurações",
};

export function Header() {
  const [location] = useLocation();
  const pageName = pageNames[location] || "FarmaSystem";
  
  const today = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-foreground">{pageName}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-sm text-muted-foreground capitalize hidden md:block">
          {today}
        </div>
        
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
        </Button>
        
        <div className="flex items-center gap-3 border-l pl-6 border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none text-foreground">Admin</p>
            <p className="text-xs text-muted-foreground mt-0.5">Farmacêutico</p>
          </div>
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">AD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
