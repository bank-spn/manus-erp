import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Order, OrderItem } from '@/lib/types';
import { Clock, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

export default function OrderList() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { language } = useAppStore();

  useEffect(() => {
    loadOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-list')
      .on('postgres_changes', { event: '*', schema: 'pos', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;

      // Get order items for each order
      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Combine orders with items
        const ordersWithItems = ordersData.map(order => ({
          ...order,
          order_items: itemsData?.filter(item => item.order_id === order.id) || [],
        }));

        setOrders(ordersWithItems);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setShowDialog(true);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(language === 'th' ? 'อัปเดตสถานะสำเร็จ' : 'Status updated successfully');
      loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], { variant: any; label: { th: string; en: string } }> = {
      pending: { variant: 'secondary', label: { th: 'รอดำเนินการ', en: 'Pending' } },
      confirmed: { variant: 'default', label: { th: 'ยืนยันแล้ว', en: 'Confirmed' } },
      preparing: { variant: 'default', label: { th: 'กำลังเตรียม', en: 'Preparing' } },
      ready: { variant: 'default', label: { th: 'พร้อมเสิร์ฟ', en: 'Ready' } },
      completed: { variant: 'default', label: { th: 'เสร็จสิ้น', en: 'Completed' } },
      cancelled: { variant: 'destructive', label: { th: 'ยกเลิก', en: 'Cancelled' } },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant}>
        {config.label[language]}
      </Badge>
    );
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">{language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'th' ? 'รายการออเดอร์' : 'Orders'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'th' ? 'ดูและจัดการออเดอร์ทั้งหมด' : 'View and manage all orders'}
          </p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'th' ? 'ทั้งหมด' : 'All'}</SelectItem>
            <SelectItem value="pending">{language === 'th' ? 'รอดำเนินการ' : 'Pending'}</SelectItem>
            <SelectItem value="confirmed">{language === 'th' ? 'ยืนยันแล้ว' : 'Confirmed'}</SelectItem>
            <SelectItem value="preparing">{language === 'th' ? 'กำลังเตรียม' : 'Preparing'}</SelectItem>
            <SelectItem value="ready">{language === 'th' ? 'พร้อมเสิร์ฟ' : 'Ready'}</SelectItem>
            <SelectItem value="completed">{language === 'th' ? 'เสร็จสิ้น' : 'Completed'}</SelectItem>
            <SelectItem value="cancelled">{language === 'th' ? 'ยกเลิก' : 'Cancelled'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{order.order_number}</h3>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {order.order_items.length} {language === 'th' ? 'รายการ' : 'items'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {language === 'th' ? 'ยอดรวม' : 'Total'}
                  </div>
                  <div className="font-bold text-xl">
                    ฿{parseFloat(order.total.toString()).toFixed(2)}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)}>
                    <Eye className="w-4 h-4 mr-1" />
                    {language === 'th' ? 'ดู' : 'View'}
                  </Button>
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <Select
                      value={order.status}
                      onValueChange={(v: Order['status']) => handleUpdateStatus(order.id, v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{language === 'th' ? 'รอ' : 'Pending'}</SelectItem>
                        <SelectItem value="confirmed">{language === 'th' ? 'ยืนยัน' : 'Confirmed'}</SelectItem>
                        <SelectItem value="preparing">{language === 'th' ? 'เตรียม' : 'Preparing'}</SelectItem>
                        <SelectItem value="ready">{language === 'th' ? 'พร้อม' : 'Ready'}</SelectItem>
                        <SelectItem value="completed">{language === 'th' ? 'เสร็จ' : 'Completed'}</SelectItem>
                        <SelectItem value="cancelled">{language === 'th' ? 'ยกเลิก' : 'Cancelled'}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {language === 'th' ? 'ไม่มีออเดอร์' : 'No orders found'}
          </p>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'th' ? 'รายละเอียดออเดอร์' : 'Order Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{selectedOrder.order_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Order Items */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div className="border rounded p-4">
                  <h3 className="font-semibold mb-3">
                    {language === 'th' ? 'รายการสินค้า' : 'Order Items'}
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name[language]} × {item.qty}
                        </span>
                        <span className="font-semibold">฿{parseFloat(item.total.toString()).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="border rounded p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{language === 'th' ? 'ยอดรวม' : 'Subtotal'}</span>
                  <span>฿{parseFloat(selectedOrder.subtotal.toString()).toFixed(2)}</span>
                </div>
                {parseFloat(selectedOrder.discount.toString()) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{language === 'th' ? 'ส่วนลด' : 'Discount'}</span>
                    <span>-฿{parseFloat(selectedOrder.discount.toString()).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>{language === 'th' ? 'ภาษี' : 'Tax'}</span>
                  <span>฿{parseFloat(selectedOrder.tax.toString()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{language === 'th' ? 'ยอดชำระ' : 'Total'}</span>
                  <span>฿{parseFloat(selectedOrder.total.toString()).toFixed(2)}</span>
                </div>
              </div>

              <Button onClick={() => setShowDialog(false)} className="w-full">
                {language === 'th' ? 'ปิด' : 'Close'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

