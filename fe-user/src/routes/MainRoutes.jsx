import { lazy } from 'react';

// project imports
import MainLayout from 'layout/Dashboard';
import Loadable from 'components/Loadable';
import PrivateRoute from './PrivateRoute';

// pages
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
const ServicePage = Loadable(lazy(() => import('pages/spa/service')));
const AppointmentPage = Loadable(lazy(() => import('pages/spa/appoinment')));
const ServiceHistoryPage = Loadable(lazy(() => import('pages/spa/service-history')));
const ReviewList = Loadable(lazy(() => import('pages/review/review')));

const WorkSchedulePage = Loadable(lazy(() => import('pages/roll_call/workSchedulePage')));
const AttendancePage = Loadable(lazy(() => import('pages/roll_call/attendancePage')));
const AttendanceHistoryPage = Loadable(lazy(() => import('pages/roll_call/attendanceHistoryPage')));
const SalaryHistory = Loadable(lazy(() => import('pages/salary/salary-history')));

const UserAccount = Loadable(lazy(() => import('pages/account/user')));
const AdminAccount = Loadable(lazy(() => import('pages/account/admin')));
const ProfilePage = Loadable(lazy(() => import('pages/account/profile')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/staff',
  element: <PrivateRoute />,
  children: [
    {
      path: '/staff',
      element: <MainLayout />,
      children: [
        {
          index: true,
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
          path: 'spa',
          children: [
            { path: 'service', element: <ServicePage /> },
            { path: 'appointments', element: <AppointmentPage /> },
            { path: 'service-history', element: <ServiceHistoryPage /> }
          ]
        },
        {
          path: 'roll_call',
          children: [
            { path: 'workSchedulePage', element: <WorkSchedulePage /> },
            { path: 'attendancePage', element: <AttendancePage /> },
            { path: 'attendanceHistoryPage', element: <AttendanceHistoryPage /> }
          ]
        },
        {
          path: 'salary',
          children: [{ path: 'history', element: <SalaryHistory /> }]
        },
        {
          path: 'review',
          children: [{ path: 'review', element: <ReviewList /> }]
        },
        {
          path: 'account',
          children: [
            { path: 'user', element: <UserAccount /> },
            { path: 'admin', element: <AdminAccount /> },
            { path: 'profile', element: <ProfilePage /> }
          ]
        }
      ]
    }
  ]
};

export default MainRoutes;
