// assets
import {
  ShopOutlined,
  ScissorOutlined,
  CalendarOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ShopOutlined,
  ScissorOutlined,
  CalendarOutlined
};

// ==============================|| MENU ITEMS - SPA ||============================== //

const spa = {
  id: 'spa',
  title: 'Spa',
  type: 'group',
  children: [
    {
      id: 'spa-service',
      title: 'Dịch Vụ',
      type: 'item',
      url: '/spa/service',
      icon: icons.ScissorOutlined
    },
    {
      id: 'appointments',
      title: 'Lịch Hẹn',
      type: 'item',
      url: '/spa/appointments',
      icon: icons.CalendarOutlined
    }
  ]
};

export default spa;