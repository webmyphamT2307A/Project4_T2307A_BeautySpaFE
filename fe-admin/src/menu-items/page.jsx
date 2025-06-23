// assets
import { LoginOutlined, ProfileOutlined } from '@ant-design/icons';

// icons
const icons = {
  LoginOutlined,
  ProfileOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //
const isLoggedIn = Boolean(localStorage.getItem('token'));
const pages = {
  id: 'authentication',
  title: 'Xác Thực',
  type: 'group',
  children: !isLoggedIn
    ? [
        {
          id: 'login1',
          title: 'Đăng Nhập',
          type: 'item',
          url: '/login',
          icon: icons.LoginOutlined,
          target: true
        },
        {
          id: 'register1',
          title: 'Đăng Ký',
          type: 'item',
          url: '/register',
          icon: icons.ProfileOutlined,
          target: true
        }
      ]
    : [] 
};

export default pages;