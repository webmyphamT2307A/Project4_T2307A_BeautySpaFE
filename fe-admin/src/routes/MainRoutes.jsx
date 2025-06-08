import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ServiceManagement from '../pages/spa/service';
import AppointmentManagement from '../pages/spa/appoinment';
import ServiceHistory from '../pages/spa/service-history';
import RoleManger from '../pages/role/service';
import UserScheduleManager from '../pages/userschedule/schedule';
import usePrivateRoute from './../hooks/usePrivateRoute';
import SalaryManagement from '../pages/salary/salary';
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

const ProtectedRoute = ({ element }) => {
  usePrivateRoute(['ROLE_ADMIN']); // Chỉ cho phép ROLE_ADMIN truy cập
  return element;
};

const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <ProtectedRoute element={<DashboardDefault />} />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <ProtectedRoute element={<DashboardDefault />} />
        }
      ]
    },
    {
      path: 'spa',
      children: [
        {
          path: 'service',
          element: <ProtectedRoute element={<ServiceManagement />} />
        },
        {
          path: 'appointments',
          element: <ProtectedRoute element={<AppointmentManagement />} />
        },
        {
          path: 'service-history',
          element: <ProtectedRoute element={<ServiceHistory />} />
        }
      ]
    },
    {
      path: 'role',
      children: [
        {
          path: 'service',
          element: <ProtectedRoute element={<RoleManger />} />
        }
      ]
    },
    {
      path: 'userschedule',
      children: [
        {
          path: 'schedule',
          element: <ProtectedRoute element={<UserScheduleManager />} />
    }
  ]
  },
  {
    path: 'salary',
    children: [
      
      {
        path: 'salary',
        element: <ProtectedRoute element={<SalaryManagement />} />
      }
    ]

  },
  {
    
  },
    {
      path: 'typography',
      element: <ProtectedRoute element={<Typography />} />
    },
    {
      path: 'color',
      element: <ProtectedRoute element={<Color />} />
    },
    {
      path: 'shadow',
      element: <ProtectedRoute element={<Shadow />} />
    },
    {
      path: 'sample-page',
      element: <ProtectedRoute element={<SamplePage />} />
    },
    {
      path: 'account',
      children: [
        {
          path: 'user',
          element: <ProtectedRoute element={<UserAccount />} />
        },
        {
          path: 'admin',
          element: <ProtectedRoute element={<AdminAccount />} />
        }
      ]
    }
  ]
};

export default MainRoutes;