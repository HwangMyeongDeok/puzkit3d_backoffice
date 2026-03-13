import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function PartnerApprovals() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partner Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve pending 3D Creator applications. Manager access only.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Mock Application Card 1 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Studio Alpha 3D</CardTitle>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 text-nowrap">
                Pending
              </span>
            </div>
            <CardDescription>Applied 2 days ago</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-sm">
              <p><strong>Contact:</strong> alpha@studio3d.com</p>
              <p><strong>Portfolio:</strong> 42 models uploaded</p>
            </div>
            <div className="flex gap-2 w-full pt-4">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" className="w-full">
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mock Application Card 2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Creative Prints XYZ</CardTitle>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 text-nowrap">
                Pending
              </span>
            </div>
            <CardDescription>Applied 5 hours ago</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-sm">
              <p><strong>Contact:</strong> info@creativexyz.com</p>
              <p><strong>Portfolio:</strong> 5 models uploaded</p>
            </div>
            <div className="flex gap-2 w-full pt-4">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" className="w-full">
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
