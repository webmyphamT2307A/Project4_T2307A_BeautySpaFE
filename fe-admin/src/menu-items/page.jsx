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