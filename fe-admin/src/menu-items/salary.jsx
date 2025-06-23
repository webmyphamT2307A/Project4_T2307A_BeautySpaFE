// assets
import {
  UserOutlined,
  CalendarFilled,
  DollarOutlined 
} from '@ant-design/icons';

// icons
const icons = {
  UserOutlined,
  CalendarFilled,
  DollarOutlined
};

// ==============================|| MENU ITEMS - salary ||============================== //

const salary = {
  id: 'salary',
  title: 'Tiền Lương',
  type: 'group',
  children: [
    {
      id: 'salary-service',
      title: 'Tiền Lương',
      type: 'item',
      url: '/salary/salary',
      icon: icons.DollarOutlined
    }
  ]
};

export default salary;