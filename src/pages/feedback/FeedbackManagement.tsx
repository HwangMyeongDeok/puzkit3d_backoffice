import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Star, Trash2, Eye, MessageSquare } from "lucide-react";
import { useFeedbackStore } from "@/store/feedbackStore";

// Giả lập dữ liệu để ông xem UI trước
const MOCK_DATA = [
  { id: '1', customer: 'Hoang Nguyen', product: 'Lego Castle', rating: 5, comment: 'Great product, fast delivery!', date: '2026-03-20' },
  { id: '2', customer: 'An Tran', product: 'Technic Car', rating: 2, comment: 'Missing some pieces...', date: '2026-03-19' },
];

export default function FeedbackManagement() {
  const { search, setSearch, rating, setRating } = useFeedbackStore();

  return (
    <div className="space-y-4 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          Feedback Management
        </h2>
        
        <div className="flex gap-2">
          <Input 
            placeholder="Search customer or product..." 
            className="w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="border rounded-md px-3 text-sm bg-background"
            value={rating}
            onChange={(e) => setRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[150px]">Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="max-w-[300px]">Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_DATA.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50">
                <TableCell className="font-medium">{item.customer}</TableCell>
                <TableCell className="text-blue-600 hover:underline cursor-pointer">
                  {item.product}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{item.rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 italic">
                  "{item.comment}"
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {new Date(item.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" /> View Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete / Hide
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Phân trang giả lập */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" disabled>Previous</Button>
        <Button variant="outline" size="sm" disabled>Next</Button>
      </div>
    </div>
  );
}