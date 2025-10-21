import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { 
  BarChart3, 
  Globe, 
  LayoutDashboard, 
  Package, 
  PackageOpen, 
  ShoppingCart 
} from 'lucide-react';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage } = useAppStore();

  const menuItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: { th: 'แดชบอร์ด', en: 'Dashboard' },
    },
    {
      path: '/products',
      icon: Package,
      label: { th: 'สินค้า', en: 'Products' },
    },
    {
      path: '/inventory',
      icon: PackageOpen,
      label: { th: 'สต็อก', en: 'Inventory' },
    },
    {
      path: '/orders',
      icon: ShoppingCart,
      label: { th: 'ออเดอร์', en: 'Orders' },
    },
    {
      path: '/reports',
      icon: BarChart3,
      label: { th: 'รายงาน', en: 'Reports' },
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Manus ERP</h1>
          <p className="text-sm text-muted-foreground">
            {language === 'th' ? 'ระบบจัดการ' : 'Management System'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setLocation(item.path)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label[language]}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
          >
            <Globe className="w-5 h-5 mr-3" />
            {language === 'th' ? 'English' : 'ไทย'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

