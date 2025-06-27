import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// project imports
import ThemeRoutes from 'routes';
import ThemeCustomization from 'themes';
import ScrollTop from 'components/ScrollTop';
import { AppointmentFilterProvider } from 'contexts/AppointmentFilterContext';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <AppointmentFilterProvider>
        <ScrollTop>
          <ThemeRoutes />
        </ScrollTop>
      </AppointmentFilterProvider>
      <ToastContainer position="top-right" autoClose={2000} />
    </ThemeCustomization>
  );
}