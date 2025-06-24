import { createContext, useState, useContext } from 'react';

// 1. Tạo Context để lưu trữ bộ lọc
const AppointmentFilterContext = createContext();

// 2. Tạo một "Provider" component để bọc ứng dụng.
// Component này sẽ cung cấp state (filter) và hàm để thay đổi state (setFilter)
// cho tất cả các component con bên trong nó.
export const AppointmentFilterProvider = ({ children }) => {
  const [filter, setFilter] = useState(null);

  return (
    <AppointmentFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </AppointmentFilterContext.Provider>
  );
};

// 3. Tạo một custom hook để dễ dàng sử dụng context trong các component khác
// Thay vì phải import useContext và AppointmentFilterContext ở mọi nơi,
// chúng ta chỉ cần gọi useAppointmentFilter().
export const useAppointmentFilter = () => {
  return useContext(AppointmentFilterContext);
}; 