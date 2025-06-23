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
  id: 'account',
  title: 'Tài Khoản',
  type: 'group',
  children: [
    {
      id: 'account-user',
      title: 'Người Dùng',
      type: 'item',
      url: '/account/user',
      icon: icons.UserOutlined
    },
    {
      id: 'account-admin',
      title: 'Quản Trị Viên',
      type: 'item',
      url: '/account/admin',
      icon: icons.LockOutlined
    }
  ]
};

export default account;