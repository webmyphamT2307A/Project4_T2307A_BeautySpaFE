// assets
import { PaperClipOutlined } from '@ant-design/icons';

// icons
const icons = {
    PaperClipOutlined
};

// ==============================|| MENU ITEMS - FEEDBACK ||============================== //

const feedback = {
  id: 'group-dashboard',
  title: 'Điều Hướng',
  type: 'group',
  children: [
    {
      id: 'feedback',
      title: 'Phản Hồi',
      type: 'item',
      url: '/feedback/feedback',
      icon: icons.PaperClipOutlined,
      breadcrumbs: false
    }
  ]
};

export default feedback;
