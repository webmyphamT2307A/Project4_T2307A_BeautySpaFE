// assets
import { UserOutlined } from '@ant-design/icons';

// icons
const icons = {
  UserOutlined
};

// ==============================|| MENU ITEMS - PROFILE ||============================== //

const profile = {
  id: 'profile',
  title: 'Hồ Sơ',
  type: 'group',
  children: [
    {
      id: 'my-profile',
      title: 'Hồ Sơ Của Tôi',
      type: 'item',
      url: '/profile',
      icon: icons.UserOutlined,
      breadcrumbs: true
    }
  ]
};

export default profile;
