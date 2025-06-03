// assets
import {
  UserOutlined,
  CalendarFilled
   
} from '@ant-design/icons';

// icons
const icons = {
 UserOutlined,
  CalendarFilled
};

// ==============================|| MENU ITEMS - userschedule ||============================== //

const userschedule = {
  id: 'userschedule',
  title: 'userschedule',
  type: 'group',
  children: [
    {
      id: 'userschedule-service',
      title: 'schedule',
      type: 'item',
      url: '/userschedule/schedule',
      icon: icons.CalendarFilled
    }
  ]
};

export default userschedule;