import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, getListUsersQueryKey, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ShieldCheck, Clock } from "lucide-react";
import { useForm } from "react-hook-form";

const ROLE_CONFIG: Record<string, { color: string; label: string }> = {
  admin: { color: "bg-red-100 text-red-700 border-red-200", label: "Administrador" },
  gerente: { color: "bg-purple-100 text-purple-700 border-purple-200", label: "Gerente" },
  farmaceutico: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Farmacêutico" },
  atendente: { color: "bg-green-100 text-green-700 border-green-200", label: "Atendente" },
};

interface UserForm {
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export default function Usuarios() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const { register, handleSubmit, reset, setValue, watch } = useForm<UserForm>({ defaultValues: { role: "atendente", active: true } });
  const active = watch("active");

  const openCreate = () => { setEditing(null); reset({ role: "atendente", active: true }); setOpen(true); };
  const openEdit = (u: User) => {
    setEditing(u.id);
    reset({ name: u.name, email: u.email, role: u.role, active: u.active });
    setOpen(true);
  };

  const onSubmit = (data: UserForm) => {
    const payload = { name: data.name, email: data.email, role: data.role as "admin" | "gerente" | "atendente" | "farmaceutico", active: data.active };
    if (editing) {
      updateUser.mutate({ id: editing, data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); setOpen(false); toast({ title: "Usuário atualizado" }); },
        onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
      });
    } else {
      createUser.mutate({ data: payload }, {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); setOpen(false); toast({ title: "Usuário cadastrado" }); },
        onError: () => toast({ title: "Erro ao cadastrar", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir usuário?")) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Usuário excluído" }); },
    });
  };

  const initials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
          <p className="text-muted-foreground text-sm">Gestão de usuários e permissões</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90" data-testid="button-new-user">
          <Plus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Usuário</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden md:table-cell">E-mail</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Perfil</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground hidden lg:table-cell">Último acesso</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-secondary/50 transition-colors" data-testid={`row-user-${u.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials(u.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{u.email}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={(ROLE_CONFIG[u.role] ?? ROLE_CONFIG.atendente).color}>
                          <ShieldCheck className="h-3 w-3 mr-1" />{(ROLE_CONFIG[u.role] ?? { label: u.role }).label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.active
                          ? <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>
                          : <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inativo</Badge>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="h-3.5 w-3.5" />
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString("pt-BR") : "Nunca"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)} data-testid={`button-delete-user-${u.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!users || users.length === 0) && (
                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Nenhum usuário cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome *</Label>
                <Input {...register("name", { required: true })} data-testid="input-user-name" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>E-mail *</Label>
                <Input type="email" {...register("email", { required: true })} data-testid="input-user-email" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Perfil *</Label>
                <Select defaultValue="atendente" onValueChange={(v) => setValue("role", v)}>
                  <SelectTrigger data-testid="select-user-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="farmaceutico">Farmacêutico</SelectItem>
                    <SelectItem value="atendente">Atendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center justify-between p-3 rounded-lg border">
                <Label className="cursor-pointer">Usuário Ativo</Label>
                <Switch checked={active} onCheckedChange={(v) => setValue("active", v)} data-testid="switch-user-active" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary" disabled={createUser.isPending || updateUser.isPending} data-testid="button-save-user">
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
