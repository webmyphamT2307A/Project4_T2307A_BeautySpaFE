// assets
import {
  ClockCircleOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ClockCircleOutlined
};

// ==============================|| MENU ITEMS - ATTENDANCE ||============================== //

const attendance = {
  id: 'attendance',
  title: 'Roll-Call',
  type: 'group',
  children: [
    {
      id: 'employee-attendance',
      title: 'Attendance',
      type: 'item',
      url: '/roll_call/attendancePage',
      icon: icons.ClockCircleOutlined
    }
  ]
};

export default attendance;
