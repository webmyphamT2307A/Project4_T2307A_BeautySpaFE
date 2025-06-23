// assets
import {
  ShopOutlined,
  ScissorOutlined,
  CalendarOutlined,
   HistoryOutlined,
} from '@ant-design/icons';

// icons
const icons = {
  ShopOutlined,
  ScissorOutlined,
  CalendarOutlined,
  HistoryOutlined,
};

// ==============================|| MENU ITEMS - SPA ||============================== //

const spa = {
  id: 'spa',
  title: 'Spa',
  type: 'group',
  children: [
    // {
    //   id: 'spa-service',
    //   title: 'Service',
    //   type: 'item',
    //   url: '/spa/service',
    //   icon: icons.ScissorOutlined
    // },
    {
      id: 'appointments',
      title: 'Lịch hẹn',
      type: 'item',
      url: '/spa/appointments',
      icon: icons.CalendarOutlined
    },
    // {
    //   id: 'service-history',
    //   title: 'Service History',
    //   type: 'item',
    //   url: '/spa/service-history',
    //   icon: icons.HistoryOutlined
    // },
  ]
};

export default spa;