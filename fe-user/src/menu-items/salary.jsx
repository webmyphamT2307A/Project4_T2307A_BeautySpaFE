// assets
import MoneyCollectOutlined from '@ant-design/icons/MoneyCollectOutlined';

// ==============================|| MENU ITEMS - SALARY ||============================== //

const salary = {
  id: 'salary',
  title: 'Thu nhập',
  type: 'group',
  children: [
    {
      id: 'salary-history',
      title: 'Lịch sử thu nhập',
      type: 'item',
      url: '/salary/history',
      icon: MoneyCollectOutlined,
      breadcrumbs: false
    }
  ]
};

export default salary;
