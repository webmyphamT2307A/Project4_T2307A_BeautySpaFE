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
  title: 'Điểm danh',
  type: 'group',
  children: [
    {
      id: 'attendance-history',
      title: 'Lịch sử chấm công',
      type: 'item',
      url: '/roll_call/attendanceHistoryPage',
      icon: icons.UnorderedListOutlined
    }
  ]
};

export default attendanceHistory;
