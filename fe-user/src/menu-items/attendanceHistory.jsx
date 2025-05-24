// assets
import {
  UnorderedListOutlined
} from '@ant-design/icons';

// icons
const icons = {
  UnorderedListOutlined
};

// ==============================|| MENU ITEMS - ATTENDANCE HISTORY ||============================== //

const attendanceHistory = {
  id: 'attendanceHistory',
  title: 'Roll-Call',
  type: 'group',
  children: [
    {
      id: 'attendance-history',
      title: 'Attendance History',
      type: 'item',
      url: '/roll_call/attendanceHistoryPage',
      icon: icons.UnorderedListOutlined
    }
  ]
};

export default attendanceHistory;
