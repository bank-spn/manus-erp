import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EDGE_FUNCTIONS, supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { InventoryItem, Product } from '@/lib/types';
import { AlertTriangle, Package, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface InventoryWithProduct extends InventoryItem {
  product?: Product;
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryWithProduct | null>(null);
  const { language } = useAppStore();

  const [formData, setFormData] = useState({
    qty_change: '',
    movement_type: 'IN' as 'IN' | 'OUT' | 'ADJUST',
    notes: '',
  });

  useEffect(() => {
    loadInventory();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'erp', table: 'inventory_items' }, () => {
        loadInventory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadInventory = async () => {
    try {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('updated_at', { ascending: false });

      if (inventoryError) throw inventoryError;

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Combine inventory with products
      const combined = inventoryData?.map(item => ({
        ...item,
        product: productsData?.find(p => p.id === item.product_id),
      })) || [];

      setInventory(combined);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item: InventoryWithProduct) => {
    setSelectedItem(item);
    setFormData({
      qty_change: '',
      movement_type: 'IN',
      notes: '',
    });
    setShowDialog(true);
  };

  const handleAdjust = async () => {
    if (!selectedItem) return;

    const qtyChange = parseFloat(formData.qty_change);
    if (isNaN(qtyChange) || qtyChange === 0) {
      toast.error(language === 'th' ? 'กรุณาระบุจำนวน' : 'Please enter quantity');
      return;
    }

    // Adjust sign based on movement type
    const actualQtyChange = formData.movement_type === 'OUT' ? -Math.abs(qtyChange) : Math.abs(qtyChange);

    try {
      const payload = {
        inventory_item_id: selectedItem.id,
        qty_change: actualQtyChange,
        movement_type: formData.movement_type,
        notes: formData.notes,
      };

      const response = await fetch(EDGE_FUNCTIONS.erpInventoryAdjust, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Adjustment failed');
      }

      toast.success(language === 'th' ? 'ปรับสต็อกสำเร็จ' : 'Stock adjusted successfully');
      setShowDialog(false);
      loadInventory();
    } catch (error) {
      console.error('Adjustment error:', error);
      toast.error(
        language === 'th' 
          ? `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}` 
          : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const isLowStock = (item: InventoryWithProduct) => {
    return parseFloat(item.stock_qty.toString()) <= parseFloat(item.reorder_level.toString());
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
          {language === 'th' ? 'จัดการสต็อก' : 'Inventory Management'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'th' ? 'ตรวจสอบและปรับปรุงสต็อกสินค้า' : 'Monitor and adjust product stock levels'}
        </p>
      </div>

      <div className="grid gap-4">
        {inventory.map((item) => {
          const lowStock = isLowStock(item);
          return (
            <Card key={item.id} className={`p-4 ${lowStock ? 'border-orange-500' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {item.product?.image_url ? (
                    <div className="w-16 h-16 rounded bg-muted flex-shrink-0">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name[language]}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {item.product?.name[language] || `Product ID: ${item.product_id}`}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {language === 'th' ? 'หน่วย' : 'Unit'}: {item.unit}
                    </div>
                    {lowStock && (
                      <div className="flex items-center gap-1 text-sm text-orange-600 mt-1">
                        <AlertTriangle className="w-4 h-4" />
                        {language === 'th' ? 'สต็อกใกล้หมด' : 'Low stock'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {language === 'th' ? 'คงเหลือ' : 'Stock'}
                    </div>
                    <div className={`text-2xl font-bold ${lowStock ? 'text-orange-600' : ''}`}>
                      {parseFloat(item.stock_qty.toString()).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'th' ? 'จุดสั่งซื้อ' : 'Reorder'}: {parseFloat(item.reorder_level.toString()).toFixed(2)}
                    </div>
                  </div>

                  <Button onClick={() => handleOpenDialog(item)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'th' ? 'ปรับสต็อก' : 'Adjust'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {inventory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {language === 'th' ? 'ไม่มีข้อมูลสต็อก' : 'No inventory data'}
          </p>
        </div>
      )}

      {/* Adjust Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'th' ? 'ปรับสต็อก' : 'Adjust Stock'}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded">
                <div className="font-semibold">
                  {selectedItem.product?.name[language]}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'th' ? 'คงเหลือปัจจุบัน' : 'Current stock'}: {parseFloat(selectedItem.stock_qty.toString()).toFixed(2)} {selectedItem.unit}
                </div>
              </div>

              <div>
                <Label>{language === 'th' ? 'ประเภทการเคลื่อนไหว' : 'Movement Type'}</Label>
                <RadioGroup
                  value={formData.movement_type}
                  onValueChange={(v: any) => setFormData({ ...formData, movement_type: v })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IN" id="in" />
                    <Label htmlFor="in" className="cursor-pointer">
                      {language === 'th' ? 'รับเข้า (IN)' : 'Stock In'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OUT" id="out" />
                    <Label htmlFor="out" className="cursor-pointer">
                      {language === 'th' ? 'เบิกออก (OUT)' : 'Stock Out'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ADJUST" id="adjust" />
                    <Label htmlFor="adjust" className="cursor-pointer">
                      {language === 'th' ? 'ปรับปรุง (ADJUST)' : 'Adjustment'}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="qty">{language === 'th' ? 'จำนวน' : 'Quantity'}</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.01"
                  value={formData.qty_change}
                  onChange={(e) => setFormData({ ...formData, qty_change: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="notes">{language === 'th' ? 'หมายเหตุ' : 'Notes'}</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={language === 'th' ? 'เหตุผลในการปรับสต็อก' : 'Reason for adjustment'}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
                <Button onClick={handleAdjust} className="flex-1">
                  {language === 'th' ? 'ยืนยัน' : 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

