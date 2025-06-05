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
  title: 'salary',
  type: 'group',
  children: [
    {
      id: 'salary-service',
      title: 'salary',
      type: 'item',
      url: '/salary/salary',
      icon: icons.CalendarFilled
    },
    {
      id: 'salary-calculation',
      title: 'Calculate Salary', 
      type: 'item',
      url: '/salary/calculate',
      icon: icons.DollarOutlined 
    }
  ]
};

export default salary;