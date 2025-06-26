// assets
import {
    ScheduleOutlined
     
  } from '@ant-design/icons';
  
  // icons
  const icons = {
   ScheduleOutlined
    
  };
  
  // ==============================|| MENU ITEMS - TIMESLOT ||============================== //
  
  const timeslot = {
    id: 'group-timeslot',
    title: 'Khung Giờ',
    type: 'group',
    children: [
      {
        id: 'timeslot',
        title: 'Quản Lý Khung Giờ',
        type: 'item',
        url: '/timeslot',
        icon: icons.ScheduleOutlined
      }
    ]
  };
  
  export default timeslot;