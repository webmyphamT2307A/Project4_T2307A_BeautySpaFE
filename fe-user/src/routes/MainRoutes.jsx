import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
// import ServiceManagement from '../pages/spa/service';
import AppointmentManagement from '../pages/spa/appoinment';
// import ServiceHistory from '../pages/spa/service-history';
// import RoleManger from '../pages/role/service';
import AttendancePage from '../pages/roll_call/attendancePage';
import AttendanceHistoryPage from '../pages/roll_call/attendanceHistoryPage';
import path from 'path';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

const UserAccount = Loadable(lazy(() => import('pages/account/user')));
const AdminAccount = Loadable(lazy(() => import('pages/account/admin')));
// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'roll_call',
      children: [
        {
          path: 'attendancePage',
          element: <AttendancePage />
        },
        {
          path: 'attendanceHistoryPage',
          element: <AttendanceHistoryPage />
        }
      ]
    },
    {
      path: 'spa',
      children: [
        // {
        //   path: 'service',
        //   element: <ServiceManagement />
        // },
        {
          path: 'appointments',
          element: <AppointmentManagement />
        }
        // {
        //   path: 'service-history',
        //   element: <ServiceHistory />
        // }
      ]
    },
    // {
    //   path: 'role',
    //   children: [
    //     {
    //       path: 'service',
    //       element: <RoleManger />
    //     }
    //   ]
    // },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    // {
    //   path: 'account',
    //   children: [
    //     {
    //       path: 'user',
    //       element: <UserAccount />
    //     },
    //     {
    //       path: 'admin',
    //       element: <AdminAccount />
    //     }
    //   ]
    // }
  ]
};

export default MainRoutes;
