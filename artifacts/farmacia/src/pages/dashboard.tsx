import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  useGetDashboardSummary, 
  useGetDashboardRecentSales, 
  useGetDashboardTopProducts,
  useGetDashboardLowStock
} from "@workspace/api-client-react";
import { DollarSign, ShoppingCart, AlertTriangle, Activity } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: recentSales } = useGetDashboardRecentSales();
  const { data: topProducts } = useGetDashboardTopProducts();
  const { data: lowStock } = useGetDashboardLowStock();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingSummary ? "..." : `R$ ${summary?.dailyRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingSummary ? "..." : summary?.dailySales || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingSummary ? "..." : summary?.lowStockCount || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencimento Próximo</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingSummary ? "..." : summary?.expiringCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales?.slice(0, 5).map(sale => (
                <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{sale.customerName || 'Cliente não identificado'}</p>
                    <p className="text-sm text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="font-bold text-primary">
                    R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {!recentSales?.length && <p className="text-muted-foreground py-4 text-center">Nenhuma venda recente.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts?.slice(0, 5).map(product => (
                <div key={product.productId} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{product.productName}</p>
                    <p className="text-xs text-muted-foreground">{product.quantitySold} unid.</p>
                  </div>
                </div>
              ))}
              {!topProducts?.length && <p className="text-muted-foreground py-4 text-center">Nenhum dado disponível.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
