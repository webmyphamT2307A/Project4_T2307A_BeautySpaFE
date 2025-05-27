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
  title: 'Authentication',
  type: 'group',
  children: !isLoggedIn
    ? [
        {
          id: 'login1',
          title: 'Login',
          type: 'item',
          url: '/login',
          icon: icons.LoginOutlined,
          target: true
        },
        {
          id: 'register1',
          title: 'Register',
          type: 'item',
          url: '/register',
          icon: icons.ProfileOutlined,
          target: true
        }
      ]
    : [] 
};

export default pages;