import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Category, Product } from '@/lib/types';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { language } = useAppStore();

  const [formData, setFormData] = useState({
    name_th: '',
    name_en: '',
    description_th: '',
    description_en: '',
    price: '',
    sku: '',
    category_id: '',
    image_url: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadProducts(), loadCategories()]);
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name_th: product.name.th,
        name_en: product.name.en,
        description_th: product.description?.th || '',
        description_en: product.description?.en || '',
        price: product.price.toString(),
        sku: product.sku || '',
        category_id: product.category_id?.toString() || '',
        image_url: product.image_url || '',
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name_th: '',
        name_en: '',
        description_th: '',
        description_en: '',
        price: '',
        sku: '',
        category_id: '',
        image_url: '',
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const productData = {
        name: { th: formData.name_th, en: formData.name_en },
        description: { th: formData.description_th, en: formData.description_en },
        price: parseFloat(formData.price),
        sku: formData.sku || null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success(language === 'th' ? 'อัปเดตสินค้าสำเร็จ' : 'Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success(language === 'th' ? 'เพิ่มสินค้าสำเร็จ' : 'Product added successfully');
      }

      setShowDialog(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error saving product');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(language === 'th' ? 'คุณแน่ใจหรือไม่?' : 'Are you sure?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(language === 'th' ? 'ลบสินค้าสำเร็จ' : 'Product deleted successfully');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'Error deleting product');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'th' ? 'จัดการสินค้า' : 'Products Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'th' ? 'จัดการข้อมูลสินค้าและราคา' : 'Manage products and pricing'}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          {language === 'th' ? 'เพิ่มสินค้า' : 'Add Product'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {product.image_url && (
              <div className="aspect-square bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name[language]}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name[language]}</h3>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  )}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {product.is_active ? (language === 'th' ? 'ใช้งาน' : 'Active') : (language === 'th' ? 'ไม่ใช้งาน' : 'Inactive')}
                </div>
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description[language]}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">฿{product.price.toFixed(2)}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenDialog(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {language === 'th' ? 'ยังไม่มีสินค้า' : 'No products yet'}
          </p>
          <Button onClick={() => handleOpenDialog()}>
            {language === 'th' ? 'เพิ่มสินค้าแรก' : 'Add your first product'}
          </Button>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct 
                ? (language === 'th' ? 'แก้ไขสินค้า' : 'Edit Product')
                : (language === 'th' ? 'เพิ่มสินค้า' : 'Add Product')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_th">{language === 'th' ? 'ชื่อสินค้า (ไทย)' : 'Product Name (TH)'}</Label>
                <Input
                  id="name_th"
                  value={formData.name_th}
                  onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="name_en">{language === 'th' ? 'ชื่อสินค้า (อังกฤษ)' : 'Product Name (EN)'}</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description_th">{language === 'th' ? 'คำอธิบาย (ไทย)' : 'Description (TH)'}</Label>
                <Input
                  id="description_th"
                  value={formData.description_th}
                  onChange={(e) => setFormData({ ...formData, description_th: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description_en">{language === 'th' ? 'คำอธิบาย (อังกฤษ)' : 'Description (EN)'}</Label>
                <Input
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">{language === 'th' ? 'ราคา' : 'Price'}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sku">{language === 'th' ? 'รหัสสินค้า (SKU)' : 'SKU'}</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">{language === 'th' ? 'หมวดหมู่' : 'Category'}</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'th' ? 'เลือกหมวดหมู่' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="image_url">{language === 'th' ? 'URL รูปภาพ' : 'Image URL'}</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {language === 'th' ? 'บันทึก' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

