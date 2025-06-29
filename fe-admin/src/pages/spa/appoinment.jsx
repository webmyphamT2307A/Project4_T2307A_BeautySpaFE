import { useState, useEffect } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, FormControl,
  InputLabel, IconButton, TablePagination, Box, InputAdornment, Chip, MenuItem,
  Typography, Divider, Tooltip, Accordion, AccordionSummary, AccordionDetails,
  Card, CardContent, List, ListItem, ListItemText, ListItemIcon, CircularProgress
} from '@mui/material';
import {
  SearchOutlined,
  CloseOutlined,
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  FormOutlined,
  MailOutlined,
  CloseCircleOutlined,
  ExpandOutlined,
  BugOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImageAvatar from 'components/ImageAvatar';

const API_URL = 'http://localhost:8080/api/v1/admin/appointment';
const API_STAFF_URL = 'http://localhost:8080/api/v1/admin/accounts/find-all';
const EMAIL_API_URL = 'http://localhost:8080/api/v1/email/send-appointment-confirmation';

const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return 'N/A';
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`;
};

const AppointmentManagement = () => {
  // States
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [pageTitle, setPageTitle] = useState('Quản Lý Lịch Hẹn');

  const [staffList, setStaffList] = useState([]);
  const [serviceList, setServiceList] = useState([]);
  const [editDetailDialogOpen, setEditDetailDialogOpen] = useState(false);
  const [appointmentToEditDetails, setAppointmentToEditDetails] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [strictSkillMatching, setStrictSkillMatching] = useState(false);
  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);
  const [appointmentToSendEmail, setAppointmentToSendEmail] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  // const [staffFilter, setStaffFilter] = useState('');
  // const [serviceFilter, setServiceFilter] = useState('');

  useEffect(() => {
    const dateFromUrl = searchParams.get('date');
    if (dateFromUrl) {
      setDateFilter({
        startDate: dateFromUrl,
        endDate: dateFromUrl
      });
    }
  }, [searchParams]);

  // Handle filters from dashboard navigation and review page
  useEffect(() => {
    if (location.state) {
      const { 
        filterStatus, filterDate, startDate, endDate, title, 
        serviceId, serviceName, staffId, staffName, fromReview, reviewId 
      } = location.state;
      
      if (title) {
        setPageTitle(title);
      }
      
      if (filterStatus) {
        setStatusFilter(filterStatus);
      }
      
      if (filterDate) {
        setDateFilter({
          startDate: filterDate,
          endDate: filterDate
        });
      } else if (startDate && endDate) {
        setDateFilter({
          startDate: startDate,
          endDate: endDate
        });
      }

      // Handle filters from review page
      if (fromReview) {
        console.log('🔍 Navigated from review page:', { serviceId, serviceName, staffId, staffName, reviewId });
        
        if (serviceId) {
          setServiceFilter(serviceId);
        }
        
        if (staffId) {
          setStaffFilter(staffId);
        }
      }
    }
  }, [location.state]);

  // Fetch danh sách lịch hẹn ban đầu
  useEffect(() => {
    setLoading(true);
    console.log('🚀 Starting to fetch appointments from:', API_URL);
    
    fetch(API_URL)
      .then(res => {
        console.log('📡 API Response status:', res.status);
        console.log('📡 API Response headers:', res.headers);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('🔍 RAW API Response:', data);
        console.log('🔍 Data type:', typeof data);
        console.log('🔍 Data.status:', data.status);
        console.log('🔍 Data.data type:', typeof data.data);
        console.log('🔍 Data.data length:', data.data?.length);
        
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          console.log('📋 First appointment item from API:', data.data[0]);
          console.log('📊 Available fields in first item:', Object.keys(data.data[0] || {}));
          
          // Check if this matches AppointmentResponseDto structure
          const firstItem = data.data[0];
          if (firstItem) {
            console.log('🔍 Field Analysis:');
            console.log('- id:', firstItem.id);
            console.log('- fullName:', firstItem.fullName);
            console.log('- customerName:', firstItem.customerName);
            console.log('- serviceName:', firstItem.serviceName);
            console.log('- appointmentDate:', firstItem.appointmentDate);
            console.log('- userName:', firstItem.userName);
            console.log('- userImageUrl:', firstItem.userImageUrl);
          }
          const mappedAppointments = data.data.map(item => {
            console.log('🔄 Mapping item:', item);
            const mapped = {
              id: item.id || item.appointmentId, // Backend trả về id, không phải appointmentId
              appointmentId: item.id || item.appointmentId,
            service: {
              id: item.serviceId,
              name: item.serviceName,
                price: item.servicePrice || item.price,
                duration: item.serviceDuration || 60
            },
            customer: {
                id: item.customerId,
                name: item.customerName || item.fullName, // Backend có thể trả fullName
                phone: item.customerPhone || item.phoneNumber,
                email: item.customerEmail,
                image: item.customerImageUrl
              },
              staff: {
                id: item.userId || item.staffId, // Backend trả về userId cho staff
                name: item.userName || item.staffName, // Backend trả về userName cho staff  
                email: item.userEmail,
                image: item.userImageUrl
              },
              appointmentDate: item.appointmentDate,
              endTime: item.endTime,
              timeSlot: {
                id: item.timeSlotId,
                slot: item.slot
              },
              status: item.status,
              notes: item.notes || '',
              price: item.price || item.servicePrice,
              isActive: item.isActive,
              createdAt: item.createdAt
            };
            console.log('✅ Mapped result:', mapped);
            return mapped;
          });
          console.log('🎯 Final mapped appointments:', mappedAppointments);
          setAppointments(mappedAppointments);
          setFilteredAppointments(mappedAppointments);
        } else {
          console.error('❌ Invalid API response structure:', data);
          console.error('❌ Expected: {status: "SUCCESS", data: []}');
          console.error('❌ Received:', data);
          
          // Add test data to see if UI works
          console.log('🧪 Adding test data for UI debugging...');
          const testData = [{
            id: 1,
            fullName: "Test Customer",
            phoneNumber: "0123456789",
            serviceName: "Test Service",
            appointmentDate: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            userName: "Test Staff",
            status: "pending",
            price: 100,
            slot: "morning",
            notes: "Test appointment"
          }];
          
          const mappedTestData = testData.map(item => ({
            id: item.id,
            appointmentId: item.id,
            service: {
              id: 1,
              name: item.serviceName,
              price: item.price,
              duration: 60
            },
            customer: {
              id: 1,
              name: item.fullName,
              phone: item.phoneNumber,
              email: "test@example.com",
              image: null
            },
            staff: {
              id: 1,
              name: item.userName,
              email: "staff@example.com",
              image: null
            },
            appointmentDate: item.appointmentDate,
            endTime: item.endTime,
            timeSlot: {
              id: 1,
              slot: item.slot
            },
            status: item.status,
            notes: item.notes,
            price: item.price,
            isActive: true,
            createdAt: new Date().toISOString()
          }));
          
          console.log('🧪 Test data mapped:', mappedTestData);
          setAppointments(mappedTestData);
          setFilteredAppointments(mappedTestData);
          
          // setAppointments([]);
          // setFilteredAppointments([]);
          toast.error(data.message || 'Lỗi khi tải dữ liệu lịch hẹn - Hiển thị dữ liệu test');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('❌ API Fetch Error:', error);
        setLoading(false);
        toast.error('Lỗi khi tải dữ liệu lịch hẹn');
      });
  }, []);

  // Fetch danh sách nhân viên
  useEffect(() => {
    fetch(API_STAFF_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Dữ liệu nhân viên thô từ API:', data);

        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {

          const filteredStaff = data.data.filter(user =>
            user.role && user.role.id === 3 && user.isActive
          ).map(staff => ({
            ...staff,
            fullName: staff.fullName || staff.staffName || staff.username || staff.email || 'No Name',
            skills: staff.skills || staff.userSkills || []
          }));

          console.log('Danh sách nhân viên đã lọc (bao gồm skills):', filteredStaff);

          setStaffList(filteredStaff);

          if (filteredStaff.length === 0) {
            toast.info('Không tìm thấy nhân viên/admin nào phù hợp (đang hoạt động) từ API.');
          }

        } else {
          setStaffList([]);
          toast.error(data.message || 'Không tải được danh sách nhân viên (dữ liệu không hợp lệ).');
        }
      })
      .catch(error => {
        setStaffList([]);
        toast.error(`Lỗi khi tải danh sách nhân viên: ${error.message}`);
        console.error("Lỗi khi fetch nhân viên:", error);
      });
  }, []);

  // Fetch danh sách dịch vụ
  useEffect(() => {
    fetch('http://localhost:8080/api/v1/services')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          setServiceList(data.data);
        } else {
          toast.error('Không thể tải danh sách dịch vụ.');
        }
      })
      .catch(() => toast.error('Lỗi kết nối khi tải danh sách dịch vụ.'));
  }, []);

  // Filter appointments
  useEffect(() => {
    let results = [...appointments];
    if (statusFilter !== 'all') {
      results = results.filter(appointment => appointment.status === statusFilter);
    }
    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59);
      results = results.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= start && appointmentDate <= end;
      });
    }
    // if (staffFilter) {
    //   results = results.filter(appointment => appointment.staff?.name === staffFilter);
    // }
    // if (serviceFilter) {
    //   results = results.filter(appointment => appointment.service?.name === serviceFilter);
    // }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        appointment =>
          appointment.customer.name.toLowerCase().includes(query) ||
          appointment.customer.phone.includes(query) ||
          appointment.service.name.toLowerCase().includes(query)
      );
    }
    setFilteredAppointments(results);
    setPage(0);
  }, [searchQuery, statusFilter, dateFilter, appointments]);

  // Handlers
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSearchChange = (event) => setSearchQuery(event.target.value);
  const handleStatusFilterChange = (event) => setStatusFilter(event.target.value);
  const handleDateFilterChange = (event) => setDateFilter({ ...dateFilter, [event.target.name]: event.target.value });
  const clearDateFilter = () => setDateFilter({ startDate: '', endDate: '' });

  const handleViewOpen = (appointment) => {
    setCurrentAppointment(appointment);
    setViewOpen(true);
  };
  const handleViewClose = () => setViewOpen(false);
  const handleOpenCancelDialog = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setAppointmentToCancel(null);
    setCancelDialogOpen(false);
  };

  const handleConfirmCancel = () => {
    if (!appointmentToCancel) return;
    setLoading(true);

    // Gọi đến API mới để hủy lịch
    fetch(`${API_URL}/${appointmentToCancel.id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success(`Hủy lịch hẹn #${appointmentToCancel.id} thành công! Slot thời gian của nhân viên đã được giải phóng.`);
          
          // Cập nhật lại state trên giao diện để hiển thị trạng thái "cancelled"
          const updatedAppointments = appointments.map(app =>
            app.id === appointmentToCancel.id
              ? { ...app, status: 'cancelled' }
              : app
          );
          setAppointments(updatedAppointments);
          
          // Đóng dialog sau khi thành công
          handleCloseCancelDialog();
          
          // Refresh lại danh sách từ server để đảm bảo đồng bộ
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } else {
          toast.error(`Lỗi: ${data.message || 'Không thể hủy lịch hẹn.'}`);
        }
      })
      .catch((error) => {
        console.error('Error cancelling appointment:', error);
        toast.error('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const handleStatusDialogOpen = (appointment) => {
    setCurrentAppointment(appointment);
    setNewStatus(appointment.status);
    setStatusDialogOpen(true);
  };
  const handleStatusDialogClose = () => setStatusDialogOpen(false);

  // Hàm xử lý cập nhật trạng thái
  const handleStatusChange = () => {
    if (!currentAppointment) return;
    setLoading(true);

    // CHỈ GỬI STATUS KHI UPDATE STATUS ĐỂ TRÁNH CONFLICT CHECK
    const updatePayload = {
      status: newStatus,
      // Chỉ gửi thêm các field bắt buộc tối thiểu
      fullName: currentAppointment.customer.name,
      phoneNumber: currentAppointment.customer.phone,
      notes: currentAppointment.notes || ''
    };

    console.log('🔄 Updating status only, payload:', updatePayload);

    fetch(`${API_URL}/update?AiD=${currentAppointment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success(`Cập nhật trạng thái thành công: ${newStatus}`);
          const updatedAppointments = appointments.map(a =>
            a.id === currentAppointment.id
              ? { ...a, status: newStatus }
              : a
          );
          setAppointments(updatedAppointments);
          handleStatusDialogClose();
          
          // Refresh lại danh sách để đảm bảo đồng bộ
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error(data.message || 'Cập nhật thất bại');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('❌ Status update error:', error);
        toast.error('Lỗi khi cập nhật trạng thái');
        setLoading(false);
        handleStatusDialogClose();
      });
  };

  // Handlers cho Edit Detail Dialog (bao gồm gán nhân viên)
  const handleOpenEditDetailDialog = (appointment) => {
    setAppointmentToEditDetails(appointment);
    setSelectedStaffId(appointment.staff.id || null);
    setEditDetailDialogOpen(true);
  };

  const handleCloseEditDetailDialog = () => {
    setEditDetailDialogOpen(false);
    setAppointmentToEditDetails(null);
    setSelectedStaffId(null);
  };

  const handleSelectedStaffChange = (event) => {
    setSelectedStaffId(event.target.value === '' ? null : event.target.value);
  };

  // Hàm kiểm tra xung đột thời gian giữa 2 appointment
  const isTimeConflict = (appointment1, appointment2) => {
    const start1 = new Date(appointment1.appointmentDate);
    const end1 = new Date(appointment1.endTime);
    const start2 = new Date(appointment2.appointmentDate);
    const end2 = new Date(appointment2.endTime);

    // Kiểm tra xem có overlap thời gian không
    const hasConflict = start1 < end2 && start2 < end1;

    // Debug logging để test
    if (hasConflict) {
      console.log('⚠️ TIME CONFLICT DETECTED:', {
        appointment1: {
          id: appointment1.id,
          start: start1.toLocaleString(),
          end: end1.toLocaleString()
        },
        appointment2: {
          id: appointment2.id,
          start: start2.toLocaleString(),
          end: end2.toLocaleString()
        }
      });
    }

    return hasConflict;
  };

  // Hàm kiểm tra xem nhân viên có bận trong thời gian appointment không
  const isStaffBusy = (staffId, appointmentToCheck) => {
    if (!staffId || !appointmentToCheck) return false;

    const appointmentDate = new Date(appointmentToCheck.appointmentDate);
    const checkDate = appointmentDate.toDateString();

    // Lọc các appointment trong cùng ngày của nhân viên này (trừ appointment hiện tại)
    const staffAppointmentsOnSameDay = appointments.filter(app =>
      app.staff.id === staffId &&
      app.id !== appointmentToCheck.id &&
      new Date(app.appointmentDate).toDateString() === checkDate &&
      app.status !== 'cancelled' // Không tính appointment đã cancel
    );

    console.log(`🔍 Checking staff busy status:`, {
      staffId,
      checkDate,
      appointmentToCheck: {
        id: appointmentToCheck.id,
        start: formatTime(appointmentToCheck.appointmentDate),
        end: formatTime(appointmentToCheck.endTime)
      },
      existingAppointments: staffAppointmentsOnSameDay.map(app => ({
        id: app.id,
        start: formatTime(app.appointmentDate),
        end: formatTime(app.endTime),
        status: app.status
      }))
    });

    // Kiểm tra xung đột thời gian
    const isBusy = staffAppointmentsOnSameDay.some(existingApp =>
      isTimeConflict(appointmentToCheck, existingApp)
    );

    if (isBusy) {
      console.log(`❌ Staff is BUSY! Cannot assign to appointment ${appointmentToCheck.id}`);
    } else {
      console.log(`✅ Staff is AVAILABLE for appointment ${appointmentToCheck.id}`);
    }

    return isBusy;
  };

  // Hàm kiểm tra xem nhân viên có skill phù hợp với service không
  const hasMatchingSkill = (staff, serviceId, serviceName) => {
    console.log(`🔍 Checking staff ${staff.staffName}:`, {
      staffId: staff.id,
      skills: staff.skills,
      skillsLength: staff.skills?.length,
      serviceId,
      serviceName,
      staffStructure: {
        userSkills: staff.skills
      }
    });

    // Xử lý trường hợp staff không có skills hoặc skills là empty
    if (!staff.skills || !Array.isArray(staff.skills) || staff.skills.length === 0) {
      console.log(`❌ Staff ${staff.staffName} has no skills - BLOCKING assignment`);
      return false; // Chỉ cho phép nhân viên có skill
    }

    // Debug: In chi tiết cấu trúc skills
    staff.skills.forEach((skill, index) => {
      console.log(`  Skill ${index + 1}:`, {
        id: skill.id,
        skillName: skill.skillName || skill.name,
        serviceId: skill.serviceId || skill.service_id,
        description: skill.description,
        fullSkillObject: skill
      });
    });

    // Kiểm tra match theo nhiều cách với độ ưu tiên từ cao xuống thấp:
    const hasMatch = staff.skills.some(skill => {
      const skillName = skill.skillName || skill.name || '';
      const skillServiceId = skill.serviceId || skill.service_id || skill.id;

      console.log(`    Comparing skill:`, {
        skillName,
        skillServiceId,
        withService: { serviceId, serviceName }
      });

      // Cách 1: Match exact service ID với skill service ID hoặc skill ID
      if (skillServiceId && (skillServiceId === serviceId || skillServiceId === parseInt(serviceId))) {
        console.log(`✅ Service ID Match: Staff ${staff.staffName} skill "${skillName}" (serviceId: ${skillServiceId}) matches service ID ${serviceId}`);
        return true;
      }

      // Cách 2: Match theo tên chính xác (case insensitive, bỏ spaces thừa)
      if (skillName && serviceName) {
        const cleanSkillName = skillName.toLowerCase().trim();
        const cleanServiceName = serviceName.toLowerCase().trim();
        
        if (cleanSkillName === cleanServiceName) {
          console.log(`✅ Exact Name Match: Staff ${staff.staffName} skill "${skillName}" matches service "${serviceName}"`);
          return true;
        }

        // Cách 3: Match partial name (skill name chứa trong service name hoặc ngược lại)
        if (cleanSkillName.includes(cleanServiceName) || cleanServiceName.includes(cleanSkillName)) {
          console.log(`✅ Partial Name Match: Staff ${staff.staffName} skill "${skillName}" partially matches service "${serviceName}"`);
          return true;
        }

        // Cách 4: Match bằng keyword (ít nhất 2 từ khóa chung, độ dài >= 3 ký tự)
        const skillKeywords = cleanSkillName.split(/\s+/).filter(word => word.length >= 3);
        const serviceKeywords = cleanServiceName.split(/\s+/).filter(word => word.length >= 3);

        const commonKeywords = skillKeywords.filter(skillWord =>
          serviceKeywords.some(serviceWord => 
            skillWord === serviceWord || 
            skillWord.includes(serviceWord) || 
            serviceWord.includes(skillWord)
          )
        );

        if (commonKeywords.length >= 1 && skillKeywords.length > 0 && serviceKeywords.length > 0) {
          console.log(`✅ Keyword Match: Staff ${staff.staffName} skill "${skillName}" has common keywords [${commonKeywords.join(', ')}] with service "${serviceName}"`);
          return true;
        }

        // Cách 5: Match theo danh mục dịch vụ phổ biến
        const skillCategories = {
          'massage': ['massage', 'body', 'relax', 'therapy', 'deep tissue', 'swedish', 'hot stone'],
          'facial': ['facial', 'face', 'skin', 'cleansing', 'anti-aging', 'hydrating'],
          'hair': ['hair', 'cut', 'style', 'color', 'perm', 'treatment'],
          'nail': ['nail', 'manicure', 'pedicure', 'polish', 'gel'],
          'beauty': ['beauty', 'makeup', 'eyebrow', 'eyelash', 'wax'],
          'spa': ['spa', 'aromatherapy', 'sauna', 'steam', 'hydrotherapy']
        };

        for (const [category, keywords] of Object.entries(skillCategories)) {
          const skillMatchesCategory = keywords.some(keyword => cleanSkillName.includes(keyword));
          const serviceMatchesCategory = keywords.some(keyword => cleanServiceName.includes(keyword));
          
          if (skillMatchesCategory && serviceMatchesCategory) {
            console.log(`✅ Category Match: Staff ${staff.staffName} skill "${skillName}" and service "${serviceName}" both match category "${category}"`);
            return true;
          }
        }
      }

      console.log(`    ❌ No match for skill "${skillName}"`);
      return false;
    });

    if (!hasMatch) {
      console.log(`❌ FINAL RESULT: Staff ${staff.staffName} skills [${staff.skills.map(s => s.skillName || s.name).join(', ')}] don't match service "${serviceName}" (ID: ${serviceId})`);
    } else {
      console.log(`✅ FINAL RESULT: Staff ${staff.staffName} has matching skills for service "${serviceName}"`);
    }

    return hasMatch;
  };

  // Lấy danh sách nhân viên available cho appointment
  const getAvailableStaff = () => {
    if (!appointmentToEditDetails) return staffList;

    console.log('\n🎯 === SKILL MATCHING ANALYSIS ===');
    console.log('Service cần match:', {
      id: appointmentToEditDetails.service.id,
      name: appointmentToEditDetails.service.name,
      fullServiceObject: appointmentToEditDetails.service
    });
    console.log('Tổng số nhân viên:', staffList.length);

    // Debug: Hiển thị tất cả staff và skills của họ
    console.log('\n📋 Danh sách tất cả nhân viên và skills:');
    staffList.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.staffName} (ID: ${staff.id}):`, {
        skillsCount: staff.skills?.length || 0,
        skills: staff.skills?.map(s => ({
          id: s.id,
          name: s.skillName || s.name,
          serviceId: s.serviceId || s.service_id
        })) || [],
        rawSkills: staff.skills
      });
    });

    // Áp dụng skill matching
    const filteredBySkill = staffList.filter(staff => {
      const isMatch = hasMatchingSkill(staff, appointmentToEditDetails.service.id, appointmentToEditDetails.service.name);
      console.log(`${isMatch ? '✅' : '❌'} Staff ${staff.staffName}: ${isMatch ? 'MATCHED' : 'NO MATCH'}`);
      return isMatch;
    });

    console.log('\n📊 KẾT QUẢ LỌC SKILLS:');
    console.log(`  - Tổng nhân viên: ${staffList.length}`);
    console.log(`  - Có skill phù hợp: ${filteredBySkill.length}`);
    console.log(`  - Danh sách nhân viên phù hợp:`, filteredBySkill.map(s => s.staffName));

    if (filteredBySkill.length === 0) {
      console.log('\n⚠️ KHÔNG CÓ NHÂN VIÊN NÀO PHƯƠNG HỢP!');
      console.log('Có thể do:');
      console.log('1. Cấu trúc dữ liệu skills từ API khác với expected');
      console.log('2. Service ID/name không khớp với skill data');
      console.log('3. Logic matching quá strict');
      console.log('4. Nhân viên chưa được gán skills phù hợp');
      
      // Thêm option để bypass skill matching (cho debug)
      console.log('\n🔧 DEBUG: Trả về tất cả staff để kiểm tra...');
      toast.warning(`Không tìm thấy nhân viên có skill phù hợp với "${appointmentToEditDetails.service.name}". Hiển thị tất cả nhân viên để debug.`);
      
      // Return all staff for debugging purposes
      return staffList.map(staff => ({
        ...staff,
        isBusy: isStaffBusy(staff.id, appointmentToEditDetails),
        isDebugMode: true // Flag để hiển thị thông báo
      }));
    }

    console.log('=== END SKILL MATCHING ANALYSIS ===\n');

    // Kiểm tra conflict và trả về kết quả
    return filteredBySkill.map(staff => ({
      ...staff,
      isBusy: isStaffBusy(staff.id, appointmentToEditDetails)
    }));
  };

  // Hàm mở dialog gửi email xác nhận
  const handleOpenEmailConfirmation = (appointment) => {
    setAppointmentToSendEmail(appointment);
    setEmailConfirmationOpen(true);
  };

  const handleCloseEmailConfirmation = () => {
    setEmailConfirmationOpen(false);
    setAppointmentToSendEmail(null);
  };

  // Hàm gửi email xác nhận appointment
  const handleSendConfirmationEmail = async () => {
    if (!appointmentToSendEmail) return;

    setEmailSending(true);

    try {
      const emailPayload = {
        appointmentId: appointmentToSendEmail.id,
        customerEmail: appointmentToSendEmail.customer.email || '',
        customerName: appointmentToSendEmail.customer.name,
        serviceName: appointmentToSendEmail.service.name,
        appointmentDate: appointmentToSendEmail.appointmentDate,
        appointmentTime: formatTime(appointmentToSendEmail.appointmentDate),
        endTime: formatTime(appointmentToSendEmail.endTime),
        staffName: appointmentToSendEmail.staff.name,
        price: appointmentToSendEmail.price,
        notes: appointmentToSendEmail.notes || ''
      };

      const response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      const result = await response.json();

      if (response.ok && result.status === 'SUCCESS') {
        toast.success('Confirmation email sent successfully!');
        handleCloseEmailConfirmation();
      } else {
        toast.error(result.message || 'Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending confirmation email');
    } finally {
      setEmailSending(false);
    }
  };

  // Hàm riêng để assign/unassign staff
  const handleStaffAssignment = () => {
    if (!appointmentToEditDetails) return;

    // Kiểm tra xung đột lịch trước khi save
    if (selectedStaffId && isStaffBusy(selectedStaffId, appointmentToEditDetails)) {
      const selectedStaff = staffList.find(s => s.id === selectedStaffId);
      const conflictingApps = appointments.filter(app =>
        app.staff.id === selectedStaffId &&
        app.id !== appointmentToEditDetails.id &&
        new Date(app.appointmentDate).toDateString() === new Date(appointmentToEditDetails.appointmentDate).toDateString() &&
        app.status !== 'cancelled'
      ).filter(app => isTimeConflict(appointmentToEditDetails, app));

      const conflictDetails = conflictingApps.map(app =>
        `${formatTime(app.appointmentDate)}-${formatTime(app.endTime)} (${app.customer.name})`
      ).join(', ');

      toast.error(
        `❌ CONFLICT DETECTED: ${selectedStaff?.staffName} is already busy during this time slot!\n\n` +
        `Conflicting appointments: ${conflictDetails}\n\n` +
        `Current appointment: ${formatTime(appointmentToEditDetails.appointmentDate)}-${formatTime(appointmentToEditDetails.endTime)}`,
        { autoClose: 8000 }
      );
      return;
    }

    setLoading(true);

    // Chỉ gửi thông tin cần thiết cho việc assign staff
    const staffAssignmentPayload = {
      fullName: appointmentToEditDetails.customer.name,
      phoneNumber: appointmentToEditDetails.customer.phone,
      notes: appointmentToEditDetails.notes,
      userId: selectedStaffId
    };

    console.log('👤 Assigning staff, payload:', staffAssignmentPayload);

    fetch(`${API_URL}/update?AiD=${appointmentToEditDetails.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffAssignmentPayload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success('Cập nhật nhân viên thành công!');
          // Cập nhật lại danh sách appointments trên FE
          const newStaffMemberInfo = staffList.find(staff => staff.id === selectedStaffId);

          const updatedAppointments = appointments.map(app =>
            app.id === appointmentToEditDetails.id
              ? {
                ...app,
                staff: newStaffMemberInfo
                  ? { id: newStaffMemberInfo.id, name: newStaffMemberInfo.fullName }
                  : null,
                notes: staffAssignmentPayload.notes
              }
              : app
          );
          setAppointments(updatedAppointments);
          handleCloseEditDetailDialog();
        } else {
          toast.error(data.message || 'Cập nhật nhân viên thất bại');
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi khi cập nhật nhân viên');
        setLoading(false);
      });
  };

  const handleSaveAppointmentDetails = () => {
    if (!appointmentToEditDetails) return;

    // Kiểm tra xung đột lịch trước khi save (chỉ khi có thay đổi time/staff)
    if (selectedStaffId && isStaffBusy(selectedStaffId, appointmentToEditDetails)) {
      const selectedStaff = staffList.find(s => s.id === selectedStaffId);
      const conflictingApps = appointments.filter(app =>
        app.staff.id === selectedStaffId &&
        app.id !== appointmentToEditDetails.id &&
        new Date(app.appointmentDate).toDateString() === new Date(appointmentToEditDetails.appointmentDate).toDateString() &&
        app.status !== 'cancelled'
      ).filter(app => isTimeConflict(appointmentToEditDetails, app));

      const conflictDetails = conflictingApps.map(app =>
        `${formatTime(app.appointmentDate)}-${formatTime(app.endTime)} (${app.customer.name})`
      ).join(', ');

      toast.error(
        `❌ CONFLICT DETECTED: ${selectedStaff?.staffName} is already busy during this time slot!\n\n` +
        `Conflicting appointments: ${conflictDetails}\n\n` +
        `Current appointment: ${formatTime(appointmentToEditDetails.appointmentDate)}-${formatTime(appointmentToEditDetails.endTime)}`,
        { autoClose: 8000 }
      );
      return;
    }

    setLoading(true);

    const dateObj = new Date(appointmentToEditDetails.appointmentDate);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedAppDate = `${day}/${month}/${year}`;

    // Payload cho việc update chi tiết appointment (không phải chỉ status)
    const updatePayload = {
      fullName: appointmentToEditDetails.customer.name,
      phoneNumber: appointmentToEditDetails.customer.phone,
      email: appointmentToEditDetails.customer.email,
      status: appointmentToEditDetails.status,
      slot: appointmentToEditDetails.timeSlot.slot,
      notes: appointmentToEditDetails.notes,
      appointmentDate: formattedAppDate,
      price: appointmentToEditDetails.price,
      serviceId: appointmentToEditDetails.service?.id,
      userId: selectedStaffId,
      timeSlotId: appointmentToEditDetails.timeSlot?.id
    };

    console.log('🔄 Updating appointment details, payload:', updatePayload);

    fetch(`${API_URL}/update?AiD=${appointmentToEditDetails.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success('Cập nhật lịch hẹn thành công!');
          // Cập nhật lại danh sách appointments trên FE
          const newStaffMemberInfo = staffList.find(staff => staff.id === selectedStaffId);

          const updatedAppointments = appointments.map(app =>
            app.id === appointmentToEditDetails.id
              ? {
                ...app,
                staff: newStaffMemberInfo
                  ? { id: newStaffMemberInfo.id, name: newStaffMemberInfo.fullName }
                  : null,
                notes: updatePayload.notes
              }
              : app
          );
          setAppointments(updatedAppointments);
          handleCloseEditDetailDialog();
        } else {
          toast.error(data.message || 'Cập nhật lịch hẹn thất bại');
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi khi cập nhật lịch hẹn');
        setLoading(false);
      });
  };


  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const getStatusChipProps = (status) => {
    switch (status) {
      case 'pending': return { label: 'Chờ xác nhận', color: 'warning', icon: <ClockCircleOutlined /> };
      case 'confirmed': return { label: 'Đã xác nhận', color: 'info', icon: <CheckOutlined /> };
      case 'completed': return { label: 'Hoàn thành', color: 'success', icon: <CheckOutlined /> };
      case 'cancelled': return { label: 'Đã hủy', color: 'error', icon: <CloseOutlined /> };
      default: return { label: status, color: 'default', icon: <ClockCircleOutlined /> };
    }
  };

  const currentAppointments = filteredAppointments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <MainCard title={pageTitle}>
      <Grid container spacing={3}>
        {/* Search and Filter Controls */}
        <Grid item xs={12}>
          <Card sx={{ p: 0, mb: 0 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterOutlined />
                Bộ Lọc & Tìm Kiếm
                {location.state && location.state.fromReview && (
                  <Chip 
                    size="small" 
                    label={`Từ Đánh Giá #${location.state.reviewId}`} 
                    color="secondary" 
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
                {location.state && !location.state.fromReview && (
                  <Chip 
                    size="small" 
                    label={`Từ Dashboard`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Tìm theo tên, SĐT, dịch vụ..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><SearchOutlined /></InputAdornment>),
                    sx: { borderRadius: '8px', minWidth: 220 }
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select value={statusFilter} label="Trạng thái" onChange={handleStatusFilterChange}>
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="pending">Chờ xác nhận</MenuItem>
                    <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  size="small"
                  label="Từ ngày"
                  type="date"
                  value={dateFilter.startDate}
                  name="startDate"
                  onChange={handleDateFilterChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 140 }}
                />
                <TextField
                  size="small"
                  label="Đến ngày"
                  type="date"
                  value={dateFilter.endDate}
                  name="endDate"
                  onChange={handleDateFilterChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 140 }}
                />
                <Button variant="outlined" onClick={() => {
                  setStatusFilter('all');
                  setDateFilter({ startDate: '', endDate: '' });
                  setSearchQuery('');
                  // setStaffFilter('');
                  // setServiceFilter('');
                  setPageTitle('Quản Lý Lịch Hẹn');
                }}>Xóa bộ lọc</Button>
                {location.state && location.state.fromReview && (
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => navigate('/review/review')}
                    sx={{ ml: 1 }}
                  >
                    ← Quay lại Đánh Giá
                  </Button>
                )}
              </Box>
              {/* Filter result count */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Hiển thị {filteredAppointments.length} / {appointments.length} lịch hẹn
                  {(statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate || searchQuery) && (
                    <Button 
                      size="small" 
                      onClick={() => {
                        setStatusFilter('all');
                        setDateFilter({ startDate: '', endDate: '' });
                        setSearchQuery('');
                        // setStaffFilter('');
                        // setServiceFilter('');
                        setPageTitle('Quản Lý Lịch Hẹn');
                      }}
                      sx={{ ml: 2 }}
                    >
                      Xóa Bộ Lọc
                    </Button>
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Appointments Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ maxHeight: 725, '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f8f8' } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Khách Hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Dịch Vụ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nhân Viên</TableCell>
                  
                  <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Thao Tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 1 }}>Đang tải dữ liệu lịch hẹn...</Typography>
                    </TableCell>
                  </TableRow>
                ) : currentAppointments.length > 0 ? (
                  currentAppointments.map((appointment) => {
                    const statusProps = getStatusChipProps(appointment.status);
                    return (
                      <TableRow key={appointment.id} hover>
                        <TableCell>#{appointment.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ImageAvatar src={appointment.customer?.image} alt={appointment.customer?.name} sx={{ width: 32, height: 32 }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{appointment.customer?.name}</Typography>
                              <Typography variant="caption" color="textSecondary">{appointment.customer?.phone}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{appointment.service?.name}</Typography>
                          <Typography variant="subtitle2" color="primary" sx={{ cursor: 'pointer' }}>
                            {formatCurrency(appointment.service.price)} • {appointment.service.duration} phút
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(appointment.appointmentDate)}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatTime(appointment.appointmentDate)} - {formatTime(appointment.endTime)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ImageAvatar src={appointment.staff?.image} alt={appointment.staff?.name} sx={{ width: 32, height: 32 }} />
                            <Typography variant="body2">{appointment.staff?.name || 'Unassigned'}</Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip icon={statusProps.icon} label={statusProps.label} size="small" color={statusProps.color} sx={{ borderRadius: '16px', fontWeight: 500, fontSize: '0.75rem' }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Tooltip title="Xem Chi Tiết">
                            <IconButton onClick={() => handleViewOpen(appointment)} color="info" size="small"><EyeOutlined /></IconButton>
                          </Tooltip>
                          
                          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <>
                              <Tooltip title="Cập Nhật Trạng Thái">
                                <IconButton onClick={() => handleStatusDialogOpen(appointment)} color="primary" size="small">
                                  <EditOutlined />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Chỉnh Sửa Chi Tiết / Phân Công Nhân Viên">
                                <IconButton onClick={() => handleOpenEditDetailDialog(appointment)} color="secondary" size="small">
                                  <FormOutlined />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          <Tooltip title={
                            (appointment.status === 'completed' || appointment.status === 'cancelled')
                              ? `Không thể hủy lịch hẹn đã '${appointment.status}'`
                              : "Hủy Lịch Hẹn"
                          }>
                            <span>
                              <IconButton
                                onClick={() => handleOpenCancelDialog(appointment)}
                                color="error"
                                size="small"
                                disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              >
                                <CloseCircleOutlined />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={7} align="center">Không tìm thấy lịch hẹn nào</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 15, 25]}
            component="div"
            count={filteredAppointments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>

      {/* View Appointment Details Dialog */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          Chi Tiết Lịch Hẹn
          <IconButton aria-label="close" onClick={handleViewClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {currentAppointment && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Thông Tin Khách Hàng</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ImageAvatar src={currentAppointment.customer?.image} alt={currentAppointment.customer?.name} sx={{ width: 64, height: 64 }} />
                    <Box>
                      <Typography variant="h5">{currentAppointment.customer?.name}</Typography>
                      <Typography variant="body2" color="textSecondary">{currentAppointment.customer?.phone}</Typography>
                      {currentAppointment.customer?.email && (<Typography variant="body2" color="textSecondary">{currentAppointment.customer.email}</Typography>)}
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Chi Tiết Lịch Hẹn</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Ngày</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(currentAppointment.appointmentDate)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Thời Gian</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatTime(currentAppointment.appointmentDate)} - {formatTime(currentAppointment.endTime)}</Typography></Grid>

                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Trạng Thái</Typography><Box sx={{ mt: 0.5 }}><Chip {...getStatusChipProps(currentAppointment.status)} size="small" /></Box></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Nhân Viên Được Phân Công</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <ImageAvatar src={currentAppointment.staff?.image} alt={currentAppointment.staff?.name} sx={{ width: 24, height: 24 }} />
                        <Box>
                          <Typography variant="body2">{currentAppointment.staff?.name || 'Chưa phân công'}</Typography>
                          {currentAppointment.staff?.email && (<Typography variant="caption" color="textSecondary">{currentAppointment.staff.email}</Typography>)}
                        </Box>
                      </Box>
                    </Grid>
                    {currentAppointment.notes && (<Grid item xs={12}><Typography variant="caption" color="textSecondary">Ghi Chú</Typography><Typography variant="body2">{currentAppointment.notes}</Typography></Grid>)}
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Thông Tin Dịch Vụ</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{currentAppointment.service.name}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Giá:</Typography><Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{formatCurrency(currentAppointment.price)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Thời Lượng:</Typography><Typography variant="body2">{currentAppointment.service.duration} phút</Typography></Box>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Thông Tin Đặt Lịch</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Mã Đặt Lịch</Typography><Typography variant="body2">#{currentAppointment.id}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Ngày Tạo</Typography><Typography variant="body2">{formatDate(currentAppointment.createdAt)}</Typography></Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                        
                        {currentAppointment.status !== 'completed' && currentAppointment.status !== 'cancelled' && (
                          <>
                            <Tooltip title="Cập Nhật Trạng Thái">
                              <Button variant="outlined" color="primary" onClick={() => handleStatusDialogOpen(currentAppointment)}>Cập Nhật Trạng Thái</Button>
                            </Tooltip>
                            <Tooltip title="Chỉnh Sửa Chi Tiết / Phân Công Nhân Viên">
                              <Button variant="contained" color="secondary" onClick={() => { handleViewClose(); handleOpenEditDetailDialog(currentAppointment); }}>Chỉnh Sửa Chi Tiết</Button>
                            </Tooltip>
                          </>
                        )}

                        <Tooltip title={
                          (currentAppointment.status === 'completed' || currentAppointment.status === 'cancelled')
                            ? `Không thể hủy lịch hẹn đã '${currentAppointment.status}'`
                            : "Hủy Lịch Hẹn"
                        }>
                          <span>
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => { handleViewClose(); handleOpenCancelDialog(currentAppointment); }}
                              disabled={currentAppointment.status === 'completed' || currentAppointment.status === 'cancelled'}
                              startIcon={<CloseCircleOutlined />}
                            >
                              Hủy Lịch
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleStatusDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Cập Nhật Trạng Thái Lịch Hẹn</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Thay đổi trạng thái cho lịch hẹn #{currentAppointment?.id}</Typography>
          <FormControl fullWidth>
            <InputLabel>Trạng Thái</InputLabel>
            <Select value={newStatus} label="Trạng Thái" onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="pending"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Chờ xác nhận" color="warning" sx={{ minWidth: 80 }} /><Typography variant="body2">Đang chờ xác nhận</Typography></Box></MenuItem>
              <MenuItem value="confirmed"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Đã xác nhận" color="info" sx={{ minWidth: 80 }} /><Typography variant="body2">Lịch hẹn đã được xác nhận</Typography></Box></MenuItem>
              <MenuItem value="completed"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Hoàn thành" color="success" sx={{ minWidth: 80 }} /><Typography variant="body2">Dịch vụ đã được thực hiện</Typography></Box></MenuItem>
              <MenuItem value="cancelled"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Đã hủy" color="error" sx={{ minWidth: 80 }} /><Typography variant="body2">Lịch hẹn đã bị hủy</Typography></Box></MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} color="inherit">Hủy</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Cập Nhật Trạng Thái'}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Appointment Details Dialog (bao gồm gán nhân viên) */}
      <Dialog open={editDetailDialogOpen} onClose={handleCloseEditDetailDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh Sửa Chi Tiết Lịch Hẹn #{appointmentToEditDetails?.id}</DialogTitle>
        <DialogContent>
          {appointmentToEditDetails && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Khách hàng: <strong>{appointmentToEditDetails.customer?.name}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Dịch vụ: {appointmentToEditDetails.service?.name} vào {formatDate(appointmentToEditDetails.appointmentDate)} lúc {formatTime(appointmentToEditDetails.appointmentDate)}
                </Typography>
                
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="staff-select-label-edit">Phân Công Nhân Viên</InputLabel>
                  <Select
                    labelId="staff-select-label-edit"
                    value={selectedStaffId === null ? '' : selectedStaffId}
                    label="Phân Công Nhân Viên"
                    onChange={handleSelectedStaffChange}
                  >
                    <MenuItem value="">
                      <em>-- Hủy Phân Công Nhân Viên --</em>
                    </MenuItem>
                    {getAvailableStaff().length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          Không có nhân viên nào có kỹ năng phù hợp với dịch vụ này
                        </Typography>
                      </MenuItem>
                    ) : (
                      getAvailableStaff().map((staff) => (
                        <MenuItem
                          key={staff.id}
                          value={staff.id}
                          disabled={staff.isBusy}
                          sx={{
                            opacity: staff.isBusy ? 0.6 : 1,
                            backgroundColor: staff.isDebugMode ? '#fff3e0' : 'inherit',
                            '&.Mui-disabled': {
                              opacity: 0.6
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ImageAvatar src={staff.imageUrl} alt={staff.fullName} sx={{ width: 24, height: 24 }} />
                              {staff.fullName}
                              {staff.isDebugMode && (
                                <Chip
                                  label="DEBUG"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ fontSize: '0.6rem', height: '18px', ml: 1 }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {staff.isBusy && (
                                <Chip
                                  label="Bận"
                                  size="small"
                                  color="error"
                                  sx={{ fontSize: '0.7rem', height: '20px' }}
                                />
                              )}
                              {staff.isDebugMode && (
                                <Chip
                                  label="Không Khớp Kỹ Năng"
                                  size="small"
                                  color="warning"
                                  sx={{ fontSize: '0.6rem', height: '18px' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {appointmentToEditDetails && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      * Lọc nhân viên có kỹ năng phù hợp với "{appointmentToEditDetails.service.name}"
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      * Nhân viên "Bận" đã có lịch hẹn trong thời gian này
                    </Typography>
                  </Box>
                )}
              </Grid>
          
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi Chú"
                  multiline
                  rows={3}
                  defaultValue={appointmentToEditDetails.notes}
                  // Cập nhật notes trực tiếp vào state appointmentToEditDetails nếu cần
                  // Hoặc lấy giá trị từ một state riêng cho notes trong form này
                  onChange={(e) => setAppointmentToEditDetails(prev => ({ ...prev, notes: e.target.value }))}
                  margin="normal"
                />
              </Grid>
              {/* Bạn có thể thêm các trường khác ở đây nếu muốn cho phép Admin sửa */}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseEditDetailDialog} color="inherit">
            Hủy
          </Button>
          <Button 
            onClick={handleStaffAssignment} 
            variant="outlined" 
            color="secondary" 
            disabled={loading}
          >
            {loading ? 'Đang phân công...' : 'Chỉ Phân Công Nhân Viên'}
          </Button>
          <Button 
            onClick={handleSaveAppointmentDetails} 
            variant="contained" 
            color="primary" 
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu Tất Cả Thay Đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <Dialog open={emailConfirmationOpen} onClose={handleCloseEmailConfirmation} maxWidth="md" fullWidth>
        <DialogTitle>
          Gửi Email Xác Nhận
          <IconButton aria-label="close" onClick={handleCloseEmailConfirmation} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {appointmentToSendEmail && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    <MailOutlined style={{ marginRight: 8, color: '#1976d2' }} />
                    Xem Trước Email
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Email này sẽ được gửi để xác nhận chi tiết lịch hẹn.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Đến:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appointmentToSendEmail.customer?.email || 'Không có email'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Khách:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appointmentToSendEmail.customer?.name}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Chi Tiết Lịch Hẹn</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Dịch vụ:</Typography>
                <Typography variant="body1">{appointmentToSendEmail.service?.name}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Giá:</Typography>
                <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                  {formatCurrency(appointmentToSendEmail.price)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Ngày:</Typography>
                <Typography variant="body1">{formatDate(appointmentToSendEmail.appointmentDate)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Thời gian:</Typography>
                <Typography variant="body1">
                  {formatTime(appointmentToSendEmail.appointmentDate)} - {formatTime(appointmentToSendEmail.endTime)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Nhân viên:</Typography>
                <Typography variant="body1">
                  {appointmentToSendEmail.staff?.name || 'Sẽ được phân công nhân viên'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>

              </Grid>

              {appointmentToSendEmail.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Ghi chú:</Typography>
                  <Typography variant="body1">{appointmentToSendEmail.notes}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="body2" color="primary">
                    📧 Khách hàng sẽ nhận được email chuyên nghiệp với tất cả chi tiết lịch hẹn,
                    hướng dẫn xác nhận và thông tin liên hệ.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmailConfirmation} color="inherit">
            Hủy
          </Button>
          <Button
            onClick={handleSendConfirmationEmail}
            variant="contained"
            color="primary"
            disabled={emailSending || !appointmentToSendEmail?.customer?.email}
            startIcon={emailSending ? null : <MailOutlined />}
          >
            {emailSending ? 'Đang gửi...' : 'Gửi Email Xác Nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Appointment Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloseCircleOutlined style={{ color: '#f44336' }} />
            Xác nhận hủy lịch hẹn
          </Box>
        </DialogTitle>
        <DialogContent>
          {appointmentToCancel && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Bạn có chắc chắn muốn hủy lịch hẹn này không?
              </Typography>
              
              <Paper sx={{ p: 2, mt: 2, backgroundColor: '#fff3e0', border: '1px solid #ffb74d' }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Thông tin lịch hẹn:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>ID:</strong> #{appointmentToCancel.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Khách hàng:</strong> {appointmentToCancel.customer?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Dịch vụ:</strong> {appointmentToCancel.service?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Thời gian:</strong> {formatDate(appointmentToCancel.appointmentDate)} lúc {formatTime(appointmentToCancel.appointmentDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Nhân viên:</strong> {appointmentToCancel.staff?.name || 'Chưa phân công'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Trạng thái hiện tại:</strong> 
                      <Chip 
                        {...getStatusChipProps(appointmentToCancel.status)} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Box sx={{ mt: 2, p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                  ⚠️ Lưu ý: Sau khi hủy:
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  • Lịch hẹn sẽ được đánh dấu là "Cancelled"
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Slot thời gian của nhân viên sẽ được giải phóng
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Booking liên quan sẽ bị vô hiệu hóa
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Hành động này không thể hoàn tác
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} color="inherit" variant="outlined">
            Không hủy
          </Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <CloseCircleOutlined />}
          >
            {loading ? 'Đang hủy...' : 'Xác nhận hủy lịch'}
          </Button>
        </DialogActions>
      </Dialog>

    </MainCard>
  );
};

export default AppointmentManagement;