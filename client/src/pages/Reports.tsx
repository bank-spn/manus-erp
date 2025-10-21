import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  const { language } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'th' ? 'รายงาน' : 'Reports'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'th' ? 'รายงานและวิเคราะห์ข้อมูล' : 'Reports and analytics'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {language === 'th' ? 'รายงานยอดขาย' : 'Sales Report'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {language === 'th' ? 'กำลังพัฒนา...' : 'Coming soon...'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

