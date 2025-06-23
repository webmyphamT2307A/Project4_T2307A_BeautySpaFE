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
  title: 'Điểm danh',
  type: 'group',
  children: [
    {
      id: 'employee-attendance',
      title: 'Chấm công',
      type: 'item',
      url: '/roll_call/attendancePage',
      icon: icons.ClockCircleOutlined
    },
    {
      id: 'attendance-history',
      title: 'Lịch sử chấm công',
      type: 'item',
      url: '/roll_call/attendanceHistoryPage',
      icon: icons.UnorderedListOutlined
    }
  ]
};

export default attendance;
