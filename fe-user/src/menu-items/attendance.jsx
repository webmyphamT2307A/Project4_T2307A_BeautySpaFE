// assets
import {
  ClockCircleOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ClockCircleOutlined,
  UnorderedListOutlined
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
    },
    {
      id: 'attendance-history',
      title: 'Attendance History',
      type: 'item',
      url: '/roll_call/attendanceHistoryPage',
      icon: icons.UnorderedListOutlined
    }
  ]
};

export default attendance;
