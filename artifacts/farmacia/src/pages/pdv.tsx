import { useState } from "react";
import { useGetProductByBarcode, useListProducts, useCreateSale, getListSalesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Search, Barcode, Trash2, Plus, Minus, CheckCircle, CreditCard, Banknote, Smartphone } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "cartao_credito", label: "Cartão Crédito", icon: CreditCard },
  { value: "cartao_debito", label: "Cartão Débito", icon: CreditCard },
  { value: "pix", label: "PIX", icon: Smartphone },
  { value: "convenio", label: "Convênio", icon: CreditCard },
];

export default function PDV() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [customerCpf, setCustomerCpf] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const { data: products } = useListProducts({ q: searchInput || undefined });
  const createSale = useCreateSale();

  const addToCart = (productId: number, productName: string, unitPrice: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, productName, quantity: 1, unitPrice, discount: 0 }];
    });
    setSearchInput("");
    setBarcodeInput("");
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity - i.discount, 0);
  const total = Math.max(0, subtotal - globalDiscount);

  const handleFinalize = () => {
    if (cart.length === 0) { toast({ title: "Carrinho vazio", variant: "destructive" }); return; }
    createSale.mutate({
      data: {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, discount: i.discount })),
        paymentMethod: paymentMethod as "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "convenio",
        discount: globalDiscount,
        customerCpf: customerCpf || null,
      },
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSalesQueryKey() });
        setCompleted(true);
        setTimeout(() => { setCart([]); setCustomerCpf(""); setGlobalDiscount(0); setCompleted(false); }, 3000);
        toast({ title: "Venda finalizada com sucesso!" });
      },
      onError: () => toast({ title: "Erro ao finalizar venda", variant: "destructive" }),
    });
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="bg-green-100 rounded-full p-6">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-700">Venda Concluída!</h2>
        <p className="text-muted-foreground">Total: <strong>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p>
        <p className="text-sm text-muted-foreground">Reiniciando PDV...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-primary" /> Busca de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Código de barras — pressione Enter"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && barcodeInput) {
                      const found = products?.find((p) => p.barcode === barcodeInput);
                      if (found) addToCart(found.id, found.name, found.salePrice);
                      else toast({ title: "Produto não encontrado", variant: "destructive" });
                    }
                  }}
                  data-testid="input-barcode"
                />
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por nome do produto..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} data-testid="input-product-search" />
            </div>
            {searchInput && products && products.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                {products.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p.id, p.name, p.salePrice)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/60 transition-colors border-b last:border-0 text-left"
                    data-testid={`button-add-product-${p.id}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · Estoque: {p.currentStock}</p>
                    </div>
                    <span className="font-bold text-primary">R$ {p.salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Carrinho
              {cart.length > 0 && <Badge className="bg-primary text-white">{cart.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum item no carrinho</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/20" data-testid={`cart-item-${item.productId}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/un</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)} data-testid={`button-decrease-${item.productId}`}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)} data-testid={`button-increase-${item.productId}`}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-sm">{((item.unitPrice * item.quantity) - item.discount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.productId)} data-testid={`button-remove-${item.productId}`}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CPF do Cliente (opcional)</Label>
              <Input placeholder="000.000.000-00" value={customerCpf} onChange={(e) => setCustomerCpf(e.target.value)} data-testid="input-cpf" />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${paymentMethod === m.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}
                    data-testid={`button-payment-${m.value}`}
                  >
                    <m.icon className="h-4 w-4" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Desconto Global (R$)</Label>
              <Input type="number" min={0} step="0.01" value={globalDiscount} onChange={(e) => setGlobalDiscount(Number(e.target.value))} data-testid="input-discount" />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between text-sm text-destructive"><span>Desconto</span><span>- R$ {globalDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
            </div>

            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-base"
              onClick={handleFinalize}
              disabled={cart.length === 0 || createSale.isPending}
              data-testid="button-finalize-sale"
            >
              {createSale.isPending ? "Finalizando..." : "Finalizar Venda"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
