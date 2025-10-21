import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Order } from '@/lib/types';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, startOfDay } from 'date-fns';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  lowStockItems: number;
  totalProducts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useAppStore();

  useEffect(() => {
    loadDashboardData();

    // Subscribe to realtime updates
    const ordersChannel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'pos', table: 'orders' }, () => {
        loadDashboardData();
      })
      .subscribe();

    const inventoryChannel = supabase
      .channel('dashboard-inventory')
      .on('postgres_changes', { event: '*', schema: 'erp', table: 'inventory_items' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(inventoryChannel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = startOfDay(new Date());

      // Get today's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate today's sales
      const todaySales = ordersData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const todayOrders = ordersData?.length || 0;

      // Get low stock items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*');

      if (inventoryError) throw inventoryError;

      const lowStockItems = inventoryData?.filter(
        item => parseFloat(item.stock_qty.toString()) <= parseFloat(item.reorder_level.toString())
      ).length || 0;

      // Get total products
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (productsError) throw productsError;

      setStats({
        todaySales,
        todayOrders,
        lowStockItems,
        totalProducts: productsCount || 0,
      });

      // Get recent orders (last 10)
      setRecentOrders(ordersData?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels: Record<Order['status'], { th: string; en: string }> = {
      pending: { th: 'รอดำเนินการ', en: 'Pending' },
      confirmed: { th: 'ยืนยันแล้ว', en: 'Confirmed' },
      preparing: { th: 'กำลังเตรียม', en: 'Preparing' },
      ready: { th: 'พร้อมเสิร์ฟ', en: 'Ready' },
      completed: { th: 'เสร็จสิ้น', en: 'Completed' },
      cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
    };
    return labels[status][language];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">{language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'th' ? 'แดชบอร์ด' : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'th' ? 'ภาพรวมธุรกิจของคุณ' : 'Overview of your business'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'th' ? 'ยอดขายวันนี้' : "Today's Sales"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayOrders} {language === 'th' ? 'ออเดอร์' : 'orders'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'th' ? 'ออเดอร์วันนี้' : "Today's Orders"}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'th' ? 'ออเดอร์ทั้งหมด' : 'Total orders'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'th' ? 'สินค้าคงคลัง' : 'Products'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'th' ? 'สินค้าทั้งหมด' : 'Total products'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'th' ? 'สินค้าใกล้หมด' : 'Low Stock'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'th' ? 'รายการที่ต้องสั่งซื้อ' : 'Items to reorder'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'th' ? 'ออเดอร์ล่าสุด' : 'Recent Orders'}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'th' ? 'ไม่มีออเดอร์' : 'No orders yet'}
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="font-semibold">{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">฿{parseFloat(order.total.toString()).toFixed(2)}</div>
                      <div className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

