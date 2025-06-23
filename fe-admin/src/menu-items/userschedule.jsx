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
  title: 'Lịch Trình Nhân Viên',
  type: 'group',
  children: [
    {
      id: 'userschedule-service',
      title: 'Lịch Trình',
      type: 'item',
      url: '/userschedule/schedule',
      icon: icons.CalendarFilled
    }
  ]
};

export default userschedule;