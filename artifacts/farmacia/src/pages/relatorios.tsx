import { useListSales, useListProducts, useGetDashboardMonthlySales, useGetDashboardTopProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { FileText, Download, TrendingUp, AlertTriangle, Package, DollarSign, ShoppingCart } from "lucide-react";

const getDaysUntilExpiry = (dateStr: string) => Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

export default function Relatorios() {
  const { data: sales } = useListSales({});
  const { data: products } = useListProducts({});
  const { data: monthlySales } = useGetDashboardMonthlySales();
  const { data: topProducts } = useGetDashboardTopProducts();

  const totalRevenue = sales?.filter((s) => s.status === "concluida").reduce((sum, s) => sum + s.total, 0) ?? 0;
  const expiredProducts = products?.filter((p) => {
    return false;
  }) ?? [];
  const lowStockProducts = products?.filter((p) => p.currentStock <= p.minStock) ?? [];

  const reportCards = [
    { title: "Relatório de Vendas", desc: `${sales?.length ?? 0} vendas registradas`, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    { title: "Faturamento Total", desc: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50 border-green-100" },
    { title: "Estoque Baixo", desc: `${lowStockProducts.length} produtos abaixo do mínimo`, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { title: "Produtos Cadastrados", desc: `${products?.length ?? 0} produtos no catálogo`, icon: Package, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-muted-foreground text-sm">Análises e exportações do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((r) => (
          <Card key={r.title} className={`${r.bg} hover:shadow-md transition-shadow`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <r.icon className={`h-6 w-6 ${r.color} mb-2`} />
                  <p className="font-semibold text-sm text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full text-xs gap-2">
                <Download className="h-3 w-3" /> Exportar PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Vendas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlySales && monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Faturamento"]} />
                  <Bar dataKey="revenue" fill="#C62828" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">Sem dados de vendas mensais.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.slice(0, 8).map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3" data-testid={`row-top-product-${p.productId}`}>
                    <span className="w-6 text-center font-bold text-sm text-muted-foreground">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{p.productName}</p>
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">{p.quantitySold} un</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (p.quantitySold / (topProducts[0]?.quantitySold || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-600 shrink-0">R$ {p.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">Nenhuma venda registrada.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estoque Baixo — Ação Necessária</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum produto com estoque baixo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Produto</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">Categoria</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Estoque</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Mínimo</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{p.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{p.category}</td>
                      <td className="py-3 px-4 text-right font-bold text-destructive">{p.currentStock}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{p.minStock}</td>
                      <td className="py-3 px-4 text-center">
                        {p.currentStock === 0
                          ? <Badge className="bg-red-100 text-red-700 border-red-200">Sem estoque</Badge>
                          : <Badge className="bg-amber-100 text-amber-700 border-amber-200">Estoque baixo</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
