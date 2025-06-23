// assets
import {
  UserOutlined
   
} from '@ant-design/icons';

// icons
const icons = {
 UserOutlined
  
};

// ==============================|| MENU ITEMS - role ||============================== //

const role = {
  id: 'role',
  title: 'Vai Trò',
  type: 'group',
  children: [
    {
      id: 'role-service',
      title: 'Quản Lý Vai Trò',
      type: 'item',
      url: '/role/service',
      icon: icons.UserOutlined
    }
  ]
};

export default role;