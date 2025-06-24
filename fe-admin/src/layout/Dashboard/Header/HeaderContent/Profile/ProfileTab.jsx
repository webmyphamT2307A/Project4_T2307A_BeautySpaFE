import PropTypes from 'prop-types';

// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Cookies from 'js-cookie';
// assets
import EditOutlined from '@ant-design/icons/EditOutlined';
import ProfileOutlined from '@ant-design/icons/ProfileOutlined';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';

// utils
import { useNavigate } from 'react-router-dom';

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

export default function ProfileTab() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8080/api/v1/userDetail/logout', { method: 'POST', credentials: 'include' });
    } catch (e) { }
    Cookies.remove('admin_token', { path: '/admin' });
  Cookies.remove('admin_role', { path: '/admin' });
  Cookies.remove('staff_token', { path: '/staff' });
  Cookies.remove('staff_role', { path: '/staff' });

  localStorage.removeItem('user');
  localStorage.removeItem('token');
  navigate('/login');
  };

  return (
    <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
      <ListItemButton>
        <ListItemIcon>
          <EditOutlined />
        </ListItemIcon>
        <ListItemText primary="Chỉnh Sửa Hồ Sơ" />
      </ListItemButton>
      
      <ListItemButton>
        <ListItemIcon>
          <UserOutlined />
        </ListItemIcon>
        <ListItemText primary="Xem Hồ Sơ" />
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <ProfileOutlined />
        </ListItemIcon>
        <ListItemText primary="Hồ Sơ Xã Hội" />
      </ListItemButton>
      
      <ListItemButton>
        <ListItemIcon>
          <WalletOutlined />
        </ListItemIcon>
        <ListItemText primary="Thanh Toán" />
      </ListItemButton>
      
      <ListItemButton onClick={handleLogout}>
        <ListItemIcon>
          <LogoutOutlined />
        </ListItemIcon>
        <ListItemText primary="Đăng Xuất" />
      </ListItemButton>
    </List>
  );
}

ProfileTab.propTypes = { 
  handleLogout: PropTypes.func 
};
