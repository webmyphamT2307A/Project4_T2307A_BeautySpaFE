// assets
import {
  ShopOutlined,
  BranchesOutlined,
  CalendarOutlined,
   HistoryOutlined,
} from '@ant-design/icons';

// icons
const icons = {
  ShopOutlined,
  BranchesOutlined,
  CalendarOutlined,
  HistoryOutlined,
};

// ==============================|| MENU ITEMS - branch ||============================== //

const branch = {
  id: 'branch',
  title: 'branch',
  type: 'group',
  children: [
    {
      id: 'branch-service',
      title: 'Service',
      type: 'item',
      url: '/branch/service',
      icon: icons.BranchesOutlined
    }
  ]
};

export default branch;