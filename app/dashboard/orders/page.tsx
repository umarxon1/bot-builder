import { PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusForm } from "@/components/forms/order-status-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils/format";
import { requireWorkspaceContext } from "@/server/repositories/context";
import { getOrders } from "@/server/repositories/orders";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: "new" | "contacted" | "completed" | "cancelled" | "all" }>;
}) {
  const context = await requireWorkspaceContext();
  const params = await searchParams;
  const orders = await getOrders(context.workspace.id, params.status ?? "all");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Order form orqali kelgan buyurtmalarni status bo'yicha boshqaring."
      />
      <form className="max-w-xs">
        <Select name="status" defaultValue={params.status ?? "all"}>
          <option value="all">all</option>
          <option value="new">new</option>
          <option value="contacted">contacted</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </Select>
      </form>
      {orders.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">{order.product_name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{order.customer_name}</p>
                      {order.note ? <p className="mt-1 text-xs text-slate-500">{order.note}</p> : null}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{order.phone}</td>
                    <td className="px-5 py-4">
                      <OrderStatusForm orderId={order.id} status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDateTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Buyurtmalar hali yo'q"
          description="Order form node publish qilingach bu sahifada yangi buyurtmalar paydo bo'ladi."
        />
      )}
    </div>
  );
}
