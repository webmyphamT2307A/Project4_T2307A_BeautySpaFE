// assets
import {
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  LockOutlined
} from '@ant-design/icons';

// icons
const icons = {
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  SettingOutlined
};

// ==============================|| MENU ITEMS - ACCOUNT ||============================== //

const account = {
  id: 'admin',
  title: 'Tài Khoản',
  type: 'group',
  children: [
    {
      id: 'admin-user',
      title: 'Người Dùng',
      type: 'item',
      url: '/admin/user',
      icon: icons.UserOutlined
    },
    {
      id: 'admin-admin',
      title: 'Quản Trị Viên',
      type: 'item',
      url: '/admin/admin',
      icon: icons.LockOutlined
    }
  ]
};

export default account;