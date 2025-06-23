// assets
import {
  UserOutlined,
  StarOutlined // Thêm icon này
} from '@ant-design/icons';

// icons
const icons = {
  UserOutlined,
  StarOutlined 
};

// ==============================|| MENU ITEMS - review ||============================== //

const review = {
  id: 'review',
  title: 'Đánh Giá',
  type: 'group',
  children: [
    {
      id: 'review-service',
      title: 'Đánh Giá',
      type: 'item',
      url: '/review/review',
      icon: icons.StarOutlined 
    }
  ]
};

export default review;