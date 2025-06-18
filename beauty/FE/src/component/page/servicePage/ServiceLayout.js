import React from 'react';
import { Outlet } from 'react-router-dom';

// Component này có thể chứa Header, Footer hoặc các thành phần chung cho các trang dịch vụ
function ServiceLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

export default ServiceLayout;