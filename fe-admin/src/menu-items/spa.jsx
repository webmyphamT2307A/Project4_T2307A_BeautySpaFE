// assets
import {
  ShopOutlined,
  ScissorOutlined, CalendarOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ShopOutlined,
  ScissorOutlined
};

// ==============================|| MENU ITEMS - SPA ||============================== //

const spa = {
  id: 'spa',
  title: 'Spa',
  type: 'group',
  children: [
    {
      id: 'spa-service',
      title: 'Service',
      type: 'item',
      url: '/spa/service',
      icon: icons.ScissorOutlined
    },
    {
      id: 'appointments',
      title: 'Appointments',
      type: 'item',
      url: '/spa/appointments',
      icon: CalendarOutlined
    }
  ]
};

export default spa;