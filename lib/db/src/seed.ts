import { db, usersTable, productsTable, customersTable, suppliersTable, stockLotsTable, salesTable, saleItemsTable, stockMovementsTable, financialTransactionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  await db.insert(usersTable).values([
    { name: "Admin Master", email: "admin@farmasystem.com", role: "admin", active: true },
    { name: "Maria Farmacêutica", email: "maria@farmasystem.com", role: "farmaceutico", active: true },
    { name: "João Atendente", email: "joao@farmasystem.com", role: "atendente", active: true },
  ]).onConflictDoNothing();

  await db.insert(suppliersTable).values([
    { name: "Distribuidora Pharma Sul", cnpj: "12.345.678/0001-99", email: "vendas@pharmasul.com.br", phone: "(11) 3000-1000", contact: "Carlos Mendes" },
    { name: "EMS Distribuidora", cnpj: "23.456.789/0001-88", email: "pedidos@ems.com.br", phone: "(11) 3000-2000", contact: "Ana Lima" },
    { name: "Eurofarma Distribuidora", cnpj: "34.567.890/0001-77", email: "dist@eurofarma.com.br", phone: "(11) 3000-3000", contact: "Pedro Alves" },
  ]).onConflictDoNothing();

  await db.insert(productsTable).values([
    { name: "Dipirona Sódica 500mg", genericName: "Metamizol Sódico", barcode: "7891234567890", category: "Medicamentos", manufacturer: "EMS", dosage: "500mg", unit: "cx", costPrice: "3.50", salePrice: "6.90", minStock: 20, currentStock: 45, isControlled: false, requiresPrescription: false },
    { name: "Amoxicilina 500mg", genericName: "Amoxicilina Tri-hidratada", barcode: "7891234567891", category: "Medicamentos", manufacturer: "Medley", dosage: "500mg", unit: "cx", costPrice: "8.00", salePrice: "14.90", minStock: 15, currentStock: 8, isControlled: false, requiresPrescription: true },
    { name: "Rivotril 2mg", genericName: "Clonazepam", barcode: "7891234567892", category: "Medicamentos", manufacturer: "Roche", dosage: "2mg", unit: "cx", costPrice: "18.00", salePrice: "32.00", minStock: 10, currentStock: 3, isControlled: true, anvisaCode: "MS 10216270038", requiresPrescription: true },
    { name: "Omeprazol 20mg", genericName: "Omeprazol", barcode: "7891234567893", category: "Medicamentos", manufacturer: "Teuto", dosage: "20mg", unit: "cx", costPrice: "4.50", salePrice: "9.90", minStock: 25, currentStock: 62, isControlled: false, requiresPrescription: false },
    { name: "Losartana 50mg", genericName: "Losartana Potássica", barcode: "7891234567894", category: "Medicamentos", manufacturer: "Aché", dosage: "50mg", unit: "cx", costPrice: "5.00", salePrice: "11.90", minStock: 20, currentStock: 5, isControlled: false, requiresPrescription: true },
    { name: "Paracetamol 750mg", genericName: "Paracetamol", barcode: "7891234567895", category: "Medicamentos", manufacturer: "Neo Química", dosage: "750mg", unit: "cx", costPrice: "2.50", salePrice: "5.50", minStock: 30, currentStock: 120, isControlled: false, requiresPrescription: false },
    { name: "Neutrogena Hidratante", genericName: null, barcode: "7891234567896", category: "Dermocosméticos", manufacturer: "Neutrogena", dosage: null, unit: "un", costPrice: "22.00", salePrice: "42.90", minStock: 10, currentStock: 18, isControlled: false, requiresPrescription: false },
    { name: "Vitamina C 1g Efervescente", genericName: "Ácido Ascórbico", barcode: "7891234567897", category: "Suplementos", manufacturer: "Bayer", dosage: "1g", unit: "cx", costPrice: "12.00", salePrice: "23.90", minStock: 15, currentStock: 0, isControlled: false, requiresPrescription: false },
    { name: "Ibuprofeno 600mg", genericName: "Ibuprofeno", barcode: "7891234567898", category: "Medicamentos", manufacturer: "EMS", dosage: "600mg", unit: "cx", costPrice: "6.00", salePrice: "12.50", minStock: 20, currentStock: 35, isControlled: false, requiresPrescription: false },
    { name: "Rivotril 0.5mg", genericName: "Clonazepam", barcode: "7891234567899", category: "Medicamentos", manufacturer: "Roche", dosage: "0.5mg", unit: "cx", costPrice: "15.00", salePrice: "28.00", minStock: 10, currentStock: 12, isControlled: true, anvisaCode: "MS 10216270039", requiresPrescription: true },
  ]).onConflictDoNothing();

  await db.insert(customersTable).values([
    { name: "Maria Silva Santos", cpf: "123.456.789-01", email: "maria@email.com", phone: "(11) 99111-1111", loyaltyPoints: 450, totalPurchases: "1250.00" },
    { name: "José Carlos Oliveira", cpf: "234.567.890-12", email: "jose@email.com", phone: "(11) 99222-2222", loyaltyPoints: 120, totalPurchases: "320.50" },
    { name: "Ana Paula Ferreira", cpf: "345.678.901-23", email: "ana@email.com", phone: "(11) 99333-3333", loyaltyPoints: 890, totalPurchases: "2340.00" },
    { name: "Roberto Lima Costa", cpf: "456.789.012-34", email: null, phone: "(11) 99444-4444", loyaltyPoints: 55, totalPurchases: "145.00" },
    { name: "Fernanda Souza", cpf: "567.890.123-45", email: "fernanda@email.com", phone: "(11) 99555-5555", loyaltyPoints: 230, totalPurchases: "670.80" },
  ]).onConflictDoNothing();

  const today = new Date().toISOString().split("T")[0];
  const in6Months = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const in25Days = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const in2Years = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  await db.insert(stockLotsTable).values([
    { productId: 1, lotNumber: "LOT-2025-001", quantity: 45, expirationDate: in2Years, supplierId: 1, costPrice: "3.50" },
    { productId: 2, lotNumber: "LOT-2025-002", quantity: 8, expirationDate: in6Months, supplierId: 2, costPrice: "8.00" },
    { productId: 3, lotNumber: "LOT-2025-003", quantity: 3, expirationDate: in2Years, supplierId: 1, costPrice: "18.00" },
    { productId: 4, lotNumber: "LOT-2025-004", quantity: 62, expirationDate: in2Years, supplierId: 3, costPrice: "4.50" },
    { productId: 5, lotNumber: "LOT-2025-005", quantity: 5, expirationDate: in6Months, supplierId: 1, costPrice: "5.00" },
    { productId: 6, lotNumber: "LOT-2025-006", quantity: 120, expirationDate: in2Years, supplierId: 2, costPrice: "2.50" },
    { productId: 7, lotNumber: "LOT-2025-007", quantity: 18, expirationDate: in2Years, supplierId: 3, costPrice: "22.00" },
    { productId: 8, lotNumber: "LOT-2025-008", quantity: 0, expirationDate: in25Days, supplierId: 1, costPrice: "12.00" },
    { productId: 9, lotNumber: "LOT-2025-009", quantity: 35, expirationDate: in2Years, supplierId: 2, costPrice: "6.00" },
    { productId: 10, lotNumber: "LOT-2025-010", quantity: 12, expirationDate: in2Years, supplierId: 1, costPrice: "15.00" },
  ]).onConflictDoNothing();

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);

  const [sale1] = await db.insert(salesTable).values({
    customerId: 1, customerCpf: "123.456.789-01", userId: 1,
    subtotal: "16.40", discount: "0", total: "16.40",
    paymentMethod: "pix", status: "concluida", createdAt: now,
  }).returning().onConflictDoNothing();

  if (sale1) {
    await db.insert(saleItemsTable).values([
      { saleId: sale1.id, productId: 1, quantity: 2, unitPrice: "6.90", discount: "0", total: "13.80" },
      { saleId: sale1.id, productId: 6, quantity: 1, unitPrice: "2.60", discount: "0", total: "2.60" },
    ]).onConflictDoNothing();
  }

  const [sale2] = await db.insert(salesTable).values({
    customerId: 3, customerCpf: "345.678.901-23", userId: 2,
    subtotal: "42.90", discount: "5.00", total: "37.90",
    paymentMethod: "cartao_credito", status: "concluida", createdAt: yesterday,
  }).returning().onConflictDoNothing();

  if (sale2) {
    await db.insert(saleItemsTable).values([
      { saleId: sale2.id, productId: 7, quantity: 1, unitPrice: "42.90", discount: "5.00", total: "37.90" },
    ]).onConflictDoNothing();
  }

  const [sale3] = await db.insert(salesTable).values({
    customerId: 2, customerCpf: "234.567.890-12", userId: 3,
    subtotal: "51.80", discount: "0", total: "51.80",
    paymentMethod: "dinheiro", status: "concluida", createdAt: twoDaysAgo,
  }).returning().onConflictDoNothing();

  if (sale3) {
    await db.insert(saleItemsTable).values([
      { saleId: sale3.id, productId: 4, quantity: 2, unitPrice: "9.90", discount: "0", total: "19.80" },
      { saleId: sale3.id, productId: 9, quantity: 1, unitPrice: "12.50", discount: "0", total: "12.50" },
      { saleId: sale3.id, productId: 6, quantity: 5, unitPrice: "5.50", discount: "0", total: "27.50" },  
    ]).onConflictDoNothing();
  }

  const dueDate1 = new Date(now.getTime() + 5 * 86400000).toISOString().split("T")[0];
  const dueDate2 = new Date(now.getTime() + 15 * 86400000).toISOString().split("T")[0];
  const dueDate3 = new Date(now.getTime() - 3 * 86400000).toISOString().split("T")[0];

  await db.insert(financialTransactionsTable).values([
    { type: "despesa", category: "Fornecedores", description: "Pagamento Distribuidora Pharma Sul", amount: "1250.00", dueDate: dueDate1, status: "pendente" },
    { type: "despesa", category: "Aluguel", description: "Aluguel do ponto comercial", amount: "3500.00", dueDate: dueDate2, status: "pendente" },
    { type: "despesa", category: "Fornecedores", description: "Pagamento EMS Distribuidora", amount: "800.00", dueDate: dueDate3, status: "vencido" },
    { type: "receita", category: "Vendas", description: "Recebimento vendas do mês", amount: "12500.00", dueDate: dueDate2, status: "pendente" },
    { type: "receita", category: "Convênio", description: "Repasse plano de saúde Bradesco", amount: "3200.00", dueDate: dueDate1, status: "pendente" },
    { type: "despesa", category: "Funcionários", description: "Folha de pagamento", amount: "8400.00", dueDate: dueDate2, status: "pendente" },
  ]).onConflictDoNothing();

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
