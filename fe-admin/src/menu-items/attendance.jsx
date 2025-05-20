// assets
import {
  ClockCircleOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ClockCircleOutlined
};

// ==============================|| MENU ITEMS - Attendance ||============================== //

const attendance = {
  id: 'attendance',
  title: 'Attendance',
  type: 'group',
  children: [
    {
      id: 'attendance-service',
      title: 'Attendance',
      type: 'item',
      url: '/attendance/service',
      icon: icons.ClockCircleOutlined
    }
  ]
};

export default attendance;