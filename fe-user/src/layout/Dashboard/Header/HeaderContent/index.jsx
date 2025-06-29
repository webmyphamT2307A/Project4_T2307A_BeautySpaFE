// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

// project imports
import Search from './Search';
import Profile from './Profile';
import Notification from './Notification';
import MobileSection from './MobileSection';

// project import
import { GithubOutlined, ReloadOutlined } from '@ant-design/icons';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      {!downLG && <Search />}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      {/* Reload Button */}
      <Tooltip title="Tải lại trang">
        <IconButton
          onClick={handleReload}
          sx={{
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'secondary.lighter',
              color: 'primary.main'
            }
          }}
        >
          <ReloadOutlined />
        </IconButton>
      </Tooltip>

      <Notification />
      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
}
