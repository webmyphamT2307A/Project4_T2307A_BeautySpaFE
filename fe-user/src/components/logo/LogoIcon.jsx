// material-ui
import { useTheme } from '@mui/material/styles';

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 */
import logoIconDark from 'assets/images/users/logoS.png';
import logoIcon from 'assets/images/users/logoS.png';

// ==============================|| LOGO ICON SVG ||============================== //

export default function LogoIcon() {
  const theme = useTheme();

  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     */
    <img src={theme.palette.mode === 'dark' ? logoIconDark : logoIcon} alt="Mantis" width="35" />
  );
}
