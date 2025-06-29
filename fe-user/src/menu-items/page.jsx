// assets
import { LoginOutlined, ProfileOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie'; // Import thư viện js-cookie

// icons
const icons = {
  LoginOutlined,
  ProfileOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //
const isLoggedIn = Boolean(Cookies.get('admin_token') || Cookies.get('staff_token')); // Kiểm tra token trong cookie
const pages = {
  id: 'authentication',
  title: 'Xác thực',
  type: 'group',
  children: !isLoggedIn
    ? [
        {
          id: 'login1',
          title: 'Đăng nhập',
          type: 'item',
          url: '/login',
          icon: icons.LoginOutlined,
          target: true
        },
        {
          id: 'register1',
          title: 'Đăng ký',
          type: 'item',
          url: '/register',
          icon: icons.ProfileOutlined,
          target: true
        }
      ]
    : []
};

export default pages;
