// assets
import {
  ClockCircleOutlined,
  UnorderedListOutlined,
  CalendarOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ClockCircleOutlined,
  UnorderedListOutlined,
  CalendarOutlined
};

// ==============================|| MENU ITEMS - ATTENDANCE ||============================== //

const attendance = {
  id: 'attendance',
  title: 'Điểm danh',
  type: 'group',
  children: [
    {
      id: 'work-schedule',
      title: 'Lịch làm việc',
      type: 'item',
      url: '/roll_call/workSchedulePage',
      icon: icons.CalendarOutlined
    },
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
