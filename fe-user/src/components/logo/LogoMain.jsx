// material-ui
import { useTheme } from '@mui/material/styles';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 */
import logoDark from 'assets/images/users/logo.png';
import logo from 'assets/images/users/logo.png';

// ==============================|| LOGO SVG ||============================== //

export default function LogoMain() {
  const theme = useTheme();
  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     */
    <img src={theme.palette.mode === 'dark' ? logoDark : logo} alt="Mantis" width="60" />
  );
}
