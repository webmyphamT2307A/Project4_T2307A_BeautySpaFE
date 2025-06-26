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
  title: 'Quản lý',
  type: 'group',
  children: [
    {
      id: 'role-service',
      title: 'Quản Lý Vai Trò',
      type: 'item',
      url: '/role/service',
      icon: icons.UserOutlined
    },
    {
      id: 'skill-service',
      title: 'Quản Lý Kỹ Năng',
      type: 'item',
      url: '/role/skill',
      icon: icons.UserOutlined
    }
  ]
};

export default role;