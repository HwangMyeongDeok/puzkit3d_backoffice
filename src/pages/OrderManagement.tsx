import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function OrderManagement() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            View and process pending 3D print and puzzle orders.
          </p>
        </div>
        <Button>Export CSV</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            You have 12 unfulfilled orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto border rounded-md">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">ORD-2026-001</td>
                  <td className="p-4 align-middle">Liam Smith</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                      Processing
                    </span>
                  </td>
                  <td className="p-4 align-middle">$35.00</td>
                  <td className="p-4 align-middle">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">ORD-2026-002</td>
                  <td className="p-4 align-middle">Emma Johnson</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
                      Shipped
                    </span>
                  </td>
                  <td className="p-4 align-middle">$120.50</td>
                  <td className="p-4 align-middle">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">ORD-2026-003</td>
                  <td className="p-4 align-middle">Noah Williams</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500">
                      New
                    </span>
                  </td>
                  <td className="p-4 align-middle">$45.00</td>
                  <td className="p-4 align-middle">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
