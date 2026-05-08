import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import PDV from "@/pages/pdv";
import Estoque from "@/pages/estoque";
import Produtos from "@/pages/produtos";
import Clientes from "@/pages/clientes";
import Fornecedores from "@/pages/fornecedores";
import Receitas from "@/pages/receitas";
import Controlados from "@/pages/controlados";
import Compras from "@/pages/compras";
import Financeiro from "@/pages/financeiro";
import Relatorios from "@/pages/relatorios";
import Usuarios from "@/pages/usuarios";
import Configuracoes from "@/pages/configuracoes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/pdv" component={PDV} />
            <Route path="/estoque" component={Estoque} />
            <Route path="/produtos" component={Produtos} />
            <Route path="/clientes" component={Clientes} />
            <Route path="/fornecedores" component={Fornecedores} />
            <Route path="/receitas" component={Receitas} />
            <Route path="/controlados" component={Controlados} />
            <Route path="/compras" component={Compras} />
            <Route path="/financeiro" component={Financeiro} />
            <Route path="/relatorios" component={Relatorios} />
            <Route path="/usuarios" component={Usuarios} />
            <Route path="/configuracoes" component={Configuracoes} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
