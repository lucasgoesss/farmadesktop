import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  Truck, 
  FileText, 
  ShieldAlert, 
  ShoppingBag, 
  DollarSign, 
  BarChart3, 
  UserCog, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "PDV / Vendas", href: "/pdv", icon: ShoppingCart },
  { name: "Estoque", href: "/estoque", icon: Package },
  { name: "Produtos", href: "/produtos", icon: Tags },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Fornecedores", href: "/fornecedores", icon: Truck },
  { name: "Receitas", href: "/receitas", icon: FileText },
  { name: "Medicamentos Controlados", href: "/controlados", icon: ShieldAlert },
  { name: "Compras", href: "/compras", icon: ShoppingBag },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Usuários", href: "/usuarios", icon: UserCog },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen shrink-0 border-r border-sidebar-border">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border font-bold text-2xl tracking-tight">
        FARMA
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
