import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// material-ui
import { useTheme } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import ProfileTab from './ProfileTab';
import SettingTab from './SettingTab';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import IconButton from 'components/@extended/IconButton';
import Cookies from 'js-cookie';
// assets
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import avatar1 from 'assets/images/users/avatar-1.png';

// tab panel wrapper
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`profile-tabpanel-${index}`} aria-labelledby={`profile-tab-${index}`} {...other}>
      {value === index && children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`
  };
}

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

export default function Profile() {
  const theme = useTheme();
  const location = useLocation();

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState('Chưa đăng nhập');
  const [userAvatar, setUserAvatar] = useState(avatar1);
  const [roleName, setRoleName] = useState('Chưa xác định vai trò');

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  useEffect(() => {
  // Ưu tiên lấy token và role từ cookie
  let token = Cookies.get('admin_token') || Cookies.get('staff_token') || Cookies.get('manager_token');
  let role = Cookies.get('admin_role') || Cookies.get('staff_role') || Cookies.get('manager_role');

  // Nếu không có trong cookie thì lấy từ localStorage
  if (!token || !role) {
    const user = JSON.parse(localStorage.getItem('user'));
    token = JSON.parse(localStorage.getItem('token'));
    role = user?.role?.name ? `ROLE_${user.role.name.toUpperCase()}` : null;
  }

  const fetchUserData = async (token, role) => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/userDetail/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setUserName(data.data.fullName || role);
        setUserAvatar(data.data.imageUrl || avatar1);
        setRoleName(data.data.role?.name  || 'Chưa xác định vai trò');
      } else {
        console.error(`Failed to fetch ${role} user data:`, data.message);
      }
    } catch (err) {
      console.error(`Error fetching ${role} user data:`, err.message);
    }
  };

  if (token && role) {
    console.log('Token and role found:', token, role);
    fetchUserData(token, role);
  } else {
    console.error('No valid token or role found in Cookies or localStorage');
  }
}, []);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

const handleLogout = async () => {
  try {
    await fetch('http://localhost:8080/api/v1/userDetail/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.error('Logout failed:', e);
  }

  Cookies.remove('admin_token', { path: '/admin' });
  Cookies.remove('admin_role', { path: '/admin' });
  Cookies.remove('staff_token', { path: '/staff' });
  Cookies.remove('staff_role', { path: '/staff' });
  Cookies.remove('manager_token', { path: '/manager' });
  Cookies.remove('manager_role', { path: '/manager' });

  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/staff/login';
};
  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <ButtonBase
        sx={(theme) => ({
          p: 0.25,
          bgcolor: open ? 'grey.100' : 'transparent',
          borderRadius: 1,
          '&:hover': { bgcolor: 'secondary.lighter' },
          '&:focus-visible': { outline: `2px solid ${theme.palette.secondary.dark}`, outlineOffset: 2 },
          ...theme.applyStyles('dark', { bgcolor: open ? 'background.default' : 'transparent', '&:hover': { bgcolor: 'secondary.light' } })
        })}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center', p: 0.5 }}>
          <Avatar alt="profile user" src={userAvatar} size="sm" />
          <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
            {userName}
          </Typography>
        </Stack>
      </ButtonBase>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper sx={(theme) => ({ boxShadow: theme.customShadows.z1, width: 290, minWidth: 240, maxWidth: { xs: 250, md: 290 } })}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent sx={{ px: 2.5, pt: 3 }}>
                    <Grid container justifyContent="space-between" alignItems="center">
                      <Grid>
                        <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center' }}>
                          <Avatar alt="profile user" src={userAvatar} sx={{ width: 32, height: 32 }} />
                          <Stack>
                            <Typography variant="h6">{userName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {roleName === 'admin' ? 'Quản trị viên' : roleName === 'manage' ? 'Quản Lý' : 'Nhân viên'}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Grid>
                      <Grid>
                        <Tooltip title="Logout">
                          <IconButton size="large" sx={{ color: 'text.primary' }} onClick={handleLogout}>
                            <LogoutOutlined />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </CardContent>

                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs variant="fullWidth" value={value} onChange={handleChange} aria-label="profile tabs">
                      <Tab
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textTransform: 'capitalize',
                          gap: 1.25,
                          '& .MuiTab-icon': {
                            marginBottom: 0
                          }
                        }}
                        icon={<UserOutlined />}
                        label="Profile"
                        {...a11yProps(0)}
                      />
                      <Tab
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textTransform: 'capitalize',
                          gap: 1.25,
                          '& .MuiTab-icon': {
                            marginBottom: 0
                          }
                        }}
                        icon={<SettingOutlined />}
                        label="Setting"
                        {...a11yProps(1)}
                      />
                    </Tabs>
                  </Box>
                  <TabPanel value={value} index={0} dir={theme.direction}>
                    <ProfileTab />
                  </TabPanel>
                  <TabPanel value={value} index={1} dir={theme.direction}>
                    <SettingTab />
                  </TabPanel>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}

TabPanel.propTypes = { children: PropTypes.node, value: PropTypes.number, index: PropTypes.number, other: PropTypes.any };