import { useState, useEffect } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, FormControl,
  InputLabel, IconButton, TablePagination, Box, InputAdornment, Chip, MenuItem,
  Typography, Divider, Avatar, Tooltip, Accordion, AccordionSummary, AccordionDetails,
  Card, CardContent, List, ListItem, ListItemText, ListItemIcon
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
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api/v1/admin/appointment';
const API_STAFF_URL = 'http://localhost:8080/api/v1/admin/accounts/find-all';
const EMAIL_API_URL = 'http://localhost:8080/api/v1/email/send-appointment-confirmation';

const AppointmentManagement = () => {
  // States
  const [searchParams] = useSearchParams();
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

  const [staffList, setStaffList] = useState([]);
  const [editDetailDialogOpen, setEditDetailDialogOpen] = useState(false);
  const [appointmentToEditDetails, setAppointmentToEditDetails] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [strictSkillMatching, setStrictSkillMatching] = useState(false);
  const [emailConfirmationOpen, setEmailConfirmationOpen] = useState(false);
  const [appointmentToSendEmail, setAppointmentToSendEmail] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)

  useEffect(() => {
    const dateFromUrl = searchParams.get('date');
    if (dateFromUrl) {
      setDateFilter({
        startDate: dateFromUrl,
        endDate: dateFromUrl
      });
    }
  }, [searchParams]);

  // Fetch danh sách lịch hẹn ban đầu
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
          const mappedAppointments = data.data.map(item => ({
            appointment_id: item.id,
            full_name: item.fullName,
            phone_number: item.phoneNumber,
            status: item.status,
            slot: item.slot,
            notes: item.notes,
            appointment_date: item.appointmentDate,
            end_time: item.endTime,
            price: item.price,
            service: {
              id: item.serviceId,
              name: item.serviceName,
              duration: item.serviceDuration || 60,
              price: item.price
            },
            branch: {
              id: item.branchId,
              name: item.branchName
            },
            customer: {
              name: item.customerName,
              image: item.customerImageUrl || item.customerImage || '',
              email: item.customerEmail || ''
            },
            user: { name: item.userName, image: item.userImageUrl || '' },
            created_at: item.appointmentDate,
          }));
          setAppointments(mappedAppointments);
          setFilteredAppointments(mappedAppointments);
        } else {
          setAppointments([]);
          setFilteredAppointments([]);
          toast.error(data.message || 'Lỗi khi tải dữ liệu lịch hẹn');
        }
        setLoading(false);
      })
      .catch(() => {
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
            // Đảm bảo skills là array, nếu không có thì set empty array
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
        const appointmentDate = new Date(appointment.appointment_date);
        return appointmentDate >= start && appointmentDate <= end;
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        appointment =>
          appointment.full_name.toLowerCase().includes(query) ||
          appointment.phone_number.includes(query) ||
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
    fetch(`${API_URL}/${appointmentToCancel.appointment_id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success(`Hủy lịch hẹn #${appointmentToCancel.appointment_id} thành công! Slot thời gian của nhân viên đã được giải phóng.`);
          
          // Cập nhật lại state trên giao diện để hiển thị trạng thái "cancelled"
          const updatedAppointments = appointments.map(app =>
            app.appointment_id === appointmentToCancel.appointment_id
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

    const dateObj = new Date(currentAppointment.appointment_date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const updatePayload = {
      fullName: currentAppointment.full_name,
      phoneNumber: currentAppointment.phone_number,
      status: newStatus,
      slot: currentAppointment.slot,
      notes: currentAppointment.notes,
      appointmentDate: formattedDate,
      price: currentAppointment.price,
      userId: currentAppointment.user?.id || null,
      serviceId: currentAppointment.service?.id,
      branchId: currentAppointment.branch?.id,
    };

    fetch(`${API_URL}/update?AiD=${currentAppointment.appointment_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'SUCCESS') {
          toast.success('Cập nhật trạng thái thành công');
          const updatedAppointments = appointments.map(a =>
            a.appointment_id === currentAppointment.appointment_id
              ? { ...a, status: newStatus }
              : a
          );
          setAppointments(updatedAppointments);
          handleStatusDialogClose();
        } else {
          toast.error(data.message || 'Cập nhật thất bại');
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi khi cập nhật trạng thái');
        setLoading(false);
        handleStatusDialogClose();
      });
  };

  // Handlers cho Edit Detail Dialog (bao gồm gán nhân viên)
  const handleOpenEditDetailDialog = (appointment) => {
    setAppointmentToEditDetails(appointment);
    setSelectedStaffId(appointment.user?.id || null);
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
    const start1 = new Date(appointment1.appointment_date);
    const end1 = new Date(appointment1.end_time);
    const start2 = new Date(appointment2.appointment_date);
    const end2 = new Date(appointment2.end_time);

    // Kiểm tra xem có overlap thời gian không
    const hasConflict = start1 < end2 && start2 < end1;

    // Debug logging để test
    if (hasConflict) {
      console.log('⚠️ TIME CONFLICT DETECTED:', {
        appointment1: {
          id: appointment1.appointment_id,
          start: start1.toLocaleString(),
          end: end1.toLocaleString()
        },
        appointment2: {
          id: appointment2.appointment_id,
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

    const appointmentDate = new Date(appointmentToCheck.appointment_date);
    const checkDate = appointmentDate.toDateString();

    // Lọc các appointment trong cùng ngày của nhân viên này (trừ appointment hiện tại)
    const staffAppointmentsOnSameDay = appointments.filter(app =>
      app.user?.id === staffId &&
      app.appointment_id !== appointmentToCheck.appointment_id &&
      new Date(app.appointment_date).toDateString() === checkDate &&
      app.status !== 'cancelled' // Không tính appointment đã cancel
    );

    console.log(`🔍 Checking staff busy status:`, {
      staffId,
      checkDate,
      appointmentToCheck: {
        id: appointmentToCheck.appointment_id,
        start: formatTime(appointmentToCheck.appointment_date),
        end: formatTime(appointmentToCheck.end_time)
      },
      existingAppointments: staffAppointmentsOnSameDay.map(app => ({
        id: app.appointment_id,
        start: formatTime(app.appointment_date),
        end: formatTime(app.end_time),
        status: app.status
      }))
    });

    // Kiểm tra xung đột thời gian
    const isBusy = staffAppointmentsOnSameDay.some(existingApp =>
      isTimeConflict(appointmentToCheck, existingApp)
    );

    if (isBusy) {
      console.log(`❌ Staff is BUSY! Cannot assign to appointment ${appointmentToCheck.appointment_id}`);
    } else {
      console.log(`✅ Staff is AVAILABLE for appointment ${appointmentToCheck.appointment_id}`);
    }

    return isBusy;
  };

  // Hàm kiểm tra xem nhân viên có skill phù hợp với service không
  const hasMatchingSkill = (staff, serviceId, serviceName) => {
    console.log(`🔍 Checking staff ${staff.fullName}:`, {
      staffId: staff.id,
      skills: staff.skills,
      skillsLength: staff.skills?.length,
      serviceId,
      serviceName
    });

    if (!staff.skills || !Array.isArray(staff.skills) || staff.skills.length === 0) {
      console.log(`❌ Staff ${staff.fullName} has no skills - BLOCKING assignment`);
      return false; // ĐỔI THÀNH FALSE để chỉ cho phép nhân viên có skill
    }

    // Kiểm tra match theo nhiều cách:
    // 1. Match exact service ID với skill ID
    // 2. Match service name với skill name (case insensitive)
    // 3. Match partial name (ví dụ: "Massage" skill có thể làm "Deep Tissue Massage" service)

    const hasMatch = staff.skills.some(skill => {
      // Cách 1: Match theo ID
      if (skill.serviceId === serviceId || skill.id === serviceId) {
        console.log(`✅ ID Match: Staff ${staff.fullName} skill ${skill.skillName} matches service ID ${serviceId}`);
        return true;
      }

      // Cách 2: Match theo tên chính xác (case insensitive)
      if (skill.skillName && serviceName &&
        skill.skillName.toLowerCase() === serviceName.toLowerCase()) {
        console.log(`✅ Exact Name Match: Staff ${staff.fullName} skill "${skill.skillName}" matches service "${serviceName}"`);
        return true;
      }

      // Cách 3: Match một phần tên (skill name chứa trong service name hoặc ngược lại)
      if (skill.skillName && serviceName) {
        const skillLower = skill.skillName.toLowerCase();
        const serviceLower = serviceName.toLowerCase();

        // Kiểm tra các keyword phổ biến
        const skillKeywords = skillLower.split(' ').filter(word => word.length > 2);
        const serviceKeywords = serviceLower.split(' ').filter(word => word.length > 2);

        const hasCommonKeyword = skillKeywords.some(skillWord =>
          serviceKeywords.some(serviceWord =>
            skillWord.includes(serviceWord) || serviceWord.includes(skillWord)
          )
        );

        if (hasCommonKeyword) {
          console.log(`✅ Keyword Match: Staff ${staff.fullName} skill "${skill.skillName}" has common keywords with service "${serviceName}"`);
          return true;
        }
      }

      return false;
    });

    if (!hasMatch) {
      console.log(`❌ No Match: Staff ${staff.fullName} skills [${staff.skills.map(s => s.skillName).join(', ')}] don't match service "${serviceName}" (ID: ${serviceId})`);
    }

    return hasMatch;
  };

  // Lấy danh sách nhân viên available cho appointment
  const getAvailableStaff = () => {
    if (!appointmentToEditDetails) return staffList;

    const filteredBySkill = staffList.filter(staff =>
      hasMatchingSkill(staff, appointmentToEditDetails.service.id, appointmentToEditDetails.service.name)
    );

    // Debug log để kiểm tra việc lọc theo skill
    console.log('Service cần match:', appointmentToEditDetails.service);
    console.log('Tổng số nhân viên:', staffList.length);
    console.log('Nhân viên có skill phù hợp:', filteredBySkill.length);
    console.log('Chi tiết skills của nhân viên:', staffList.map(s => ({ id: s.id, name: s.fullName, skills: s.skills })));

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
        appointmentId: appointmentToSendEmail.appointment_id,
        customerEmail: appointmentToSendEmail.customer?.email || '',
        customerName: appointmentToSendEmail.full_name,
        serviceName: appointmentToSendEmail.service.name,
        appointmentDate: appointmentToSendEmail.appointment_date,
        appointmentTime: formatTime(appointmentToSendEmail.appointment_date),
        endTime: formatTime(appointmentToSendEmail.end_time),
        staffName: appointmentToSendEmail.user?.name || 'Staff will be assigned',
        branchName: appointmentToSendEmail.branch.name,
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

  const handleSaveAppointmentDetails = () => {
    if (!appointmentToEditDetails) return;

    // Kiểm tra xung đột lịch trước khi save
    if (selectedStaffId && isStaffBusy(selectedStaffId, appointmentToEditDetails)) {
      const selectedStaff = staffList.find(s => s.id === selectedStaffId);
      const conflictingApps = appointments.filter(app =>
        app.user?.id === selectedStaffId &&
        app.appointment_id !== appointmentToEditDetails.appointment_id &&
        new Date(app.appointment_date).toDateString() === new Date(appointmentToEditDetails.appointment_date).toDateString() &&
        app.status !== 'cancelled'
      ).filter(app => isTimeConflict(appointmentToEditDetails, app));

      const conflictDetails = conflictingApps.map(app =>
        `${formatTime(app.appointment_date)}-${formatTime(app.end_time)} (${app.full_name})`
      ).join(', ');

      toast.error(
        `❌ CONFLICT DETECTED: ${selectedStaff?.fullName} is already busy during this time slot!\n\n` +
        `Conflicting appointments: ${conflictDetails}\n\n` +
        `Current appointment: ${formatTime(appointmentToEditDetails.appointment_date)}-${formatTime(appointmentToEditDetails.end_time)}`,
        { autoClose: 8000 }
      );
      return;
    }

    setLoading(true);

    const dateObj = new Date(appointmentToEditDetails.appointment_date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedAppDate = `${day}/${month}/${year}`;

    // Payload này nên bao gồm tất cả các trường mà BE AppointmentDto cho phép cập nhật
    // hoặc yêu cầu khi gọi API update.
    const updatePayload = {
      fullName: appointmentToEditDetails.full_name,
      phoneNumber: appointmentToEditDetails.phone_number,
      status: appointmentToEditDetails.status,
      slot: appointmentToEditDetails.slot,
      notes: appointmentToEditDetails.notes,
      appointmentDate: formattedAppDate,
      price: appointmentToEditDetails.price,
      serviceId: appointmentToEditDetails.service?.id,
      branchId: appointmentToEditDetails.branch?.id,
      userId: selectedStaffId
    };

    fetch(`${API_URL}/update?AiD=${appointmentToEditDetails.appointment_id}`, {
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
            app.appointment_id === appointmentToEditDetails.appointment_id
              ? {
                ...app,
                user: newStaffMemberInfo
                  ? { id: newStaffMemberInfo.id, name: newStaffMemberInfo.fullName, image: newStaffMemberInfo.imageUrl || '', email: newStaffMemberInfo.email || '' }
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
      case 'pending': return { label: 'Pending', color: 'warning', icon: <ClockCircleOutlined /> };
      case 'confirmed': return { label: 'Confirmed', color: 'info', icon: <CheckOutlined /> };
      case 'completed': return { label: 'Completed', color: 'success', icon: <CheckOutlined /> };
      case 'cancelled': return { label: 'Cancelled', color: 'error', icon: <CloseOutlined /> };
      default: return { label: status, color: 'default', icon: <ClockCircleOutlined /> };
    }
  };

  const currentAppointments = filteredAppointments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Test function để tạo dữ liệu test cho time conflict
  const createTestConflictData = () => {
    const today = new Date();
    const testAppointments = [
      {
        appointment_id: 9991,
        full_name: "Test Customer 1",
        phone_number: "0123456789",
        status: "confirmed",
        slot: "morning",
        notes: "Test conflict appointment 1",
        appointment_date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
        end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
        price: 100,
        service: { id: 1, name: "Test Service", duration: 60 },
        branch: { id: 1, name: "Test Branch" },
        customer: { name: "Test Customer 1", image: "", email: "test1@example.com" },
        user: { id: staffList[0]?.id, name: staffList[0]?.fullName, image: "" },
        created_at: today.toISOString()
      },
      {
        appointment_id: 9992,
        full_name: "Test Customer 2",
        phone_number: "0123456790",
        status: "confirmed",
        slot: "morning",
        notes: "Test conflict appointment 2 - SHOULD CONFLICT",
        appointment_date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
        end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30).toISOString(),
        price: 120,
        service: { id: 2, name: "Test Service 2", duration: 60 },
        branch: { id: 1, name: "Test Branch" },
        customer: { name: "Test Customer 2", image: "", email: "test2@example.com" },
        user: null, // Chưa assign staff - để test conflict
        created_at: today.toISOString()
      }
    ];

    if (staffList.length > 0) {
      console.log('🧪 Adding test conflict data...', testAppointments);
      setAppointments(prev => [...prev, ...testAppointments]);
      toast.info('Test conflict data added! Check the appointments for today.');
    } else {
      toast.error('No staff available for test data');
    }
  };

  return (
    <MainCard title="Appointment Management">
      <Grid container spacing={3}>
        {/* Search and Filter Controls */}
        <Grid item xs={12} display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={2}>
          <TextField
            placeholder="Search by name, phone or service"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ width: { xs: '100%', sm: '280px' } }}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchOutlined /></InputAdornment>),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseOutlined style={{ fontSize: 14 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <TextField label="From Date" type="date" size="small" name="startDate" value={dateFilter.startDate} onChange={handleDateFilterChange} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <Typography variant="body2">to</Typography>
            <TextField label="To Date" type="date" size="small" name="endDate" value={dateFilter.endDate} onChange={handleDateFilterChange} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <IconButton size="small" onClick={clearDateFilter}><CloseOutlined style={{ fontSize: 14 }} /></IconButton>
            )}
          </Box>
        </Grid>

        {/* Time Conflict Test Panel */}
        <Grid item xs={12} sx={{ mb: 2 }}>
          <Accordion>
            <AccordionSummary
              expandIcon={<  ExpandOutlined />}
              aria-controls="conflict-test-content"
              id="conflict-test-header"
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BugOutlined style={{ color: '#1976d2' }} />
                <Typography variant="h6">Time Conflict Detection Test Panel</Typography>
                <Chip
                  label="Testing Tool"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* Staff Conflict Summary */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <UserOutlined style={{ marginRight: 8 }} />
                        Staff Availability Analysis
                      </Typography>
                      <List dense>
                        {staffList.map(staff => {
                          const staffAppointments = filteredAppointments.filter(app =>
                            app.user?.id === staff.id && app.status !== 'cancelled'
                          );
                          const todayAppointments = staffAppointments.filter(app => {
                            const appDate = new Date(app.appointment_date).toDateString();
                            const today = new Date().toDateString();
                            return appDate === today;
                          });

                          return (
                            <ListItem key={staff.id} divider>
                              <ListItemIcon>
                                {todayAppointments.length > 1 ? (
                                  <WarningOutlined style={{ color: '#ff9800' }} />
                                ) : todayAppointments.length === 1 ? (
                                  <ClockCircleOutlined style={{ color: '#2196f3' }} />
                                ) : (
                                  <CheckCircleOutlined style={{ color: '#4caf50' }} />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={staff.fullName}
                                secondary={
                                  <Box>
                                    <Typography variant="caption">
                                      Today: {todayAppointments.length} appointments
                                    </Typography>
                                    <br />
                                    <Typography variant="caption">
                                      Total: {staffAppointments.length} appointments
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Time Conflict Detection Rules */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        Conflict Detection Rules
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleOutlined style={{ color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Same Day Check"
                            secondary="Only appointments on the same date are checked for conflicts"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleOutlined style={{ color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Time Overlap Detection"
                            secondary="Uses formula: start1 < end2 && start2 < end1"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleOutlined style={{ color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Status Filtering"
                            secondary="Cancelled appointments are excluded from conflict check"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleOutlined style={{ color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Real-time Validation"
                            secondary="Conflicts are checked before saving staff assignments"
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Test Instructions */}
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 2, backgroundColor: '#e3f2fd' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <BugOutlined style={{ marginRight: 8 }} />
                        How to Test Time Conflict Detection
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Step 1:</strong> Open browser console (F12) to see detailed logs
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Step 2:</strong> Try to assign the same staff to overlapping time slots:
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                        • Click "Edit Details" on any appointment<br />
                        • Try to assign a staff member who already has an appointment at that time<br />
                        • The system should show "Busy" status and prevent assignment<br />
                        • Check console for detailed conflict detection logs
                      </Typography>
                      <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                        <strong>Expected Behavior:</strong> Staff marked as "Busy" cannot be assigned, and you'll see error message: "Cannot assign this staff member. They already have an appointment during this time slot."
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={createTestConflictData}
                          startIcon={<BugOutlined />}
                          size="small"
                        >
                          Create Test Conflict Data
                        </Button>
                        <Typography variant="caption" color="textSecondary">
                          This will add 2 test appointments for today with overlapping times (9:00-10:00 and 9:30-10:30)
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Appointments Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ maxHeight: 440, '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f8f8' } }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center">Loading...</TableCell></TableRow>
                ) : currentAppointments.length > 0 ? (
                  currentAppointments.map((appointment) => {
                    const statusProps = getStatusChipProps(appointment.status);
                    return (
                      <TableRow key={appointment.appointment_id} hover>
                        <TableCell>#{appointment.appointment_id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={appointment.customer?.image} alt={appointment.full_name} sx={{ width: 32, height: 32 }}>
                              {!appointment.customer?.image && <UserOutlined />}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{appointment.full_name}</Typography>
                              <Typography variant="caption" color="textSecondary">{appointment.phone_number}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{appointment.service.name}</Typography>
                          <Typography variant="caption" color="primary">${appointment.price?.toFixed(2)} • {appointment.service.duration} min</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(appointment.appointment_date)}</Typography>
                          <Typography variant="caption" color="textSecondary">{formatTime(appointment.appointment_date)} - {formatTime(appointment.end_time)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={appointment.user?.image} alt={appointment.user?.name} sx={{ width: 32, height: 32 }}>
                              {!(appointment.user?.image) && <UserOutlined />}
                            </Avatar>
                            <Typography variant="body2">{appointment.user?.name || 'Unassigned'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{appointment.branch.name}</TableCell>
                        <TableCell>
                          <Chip icon={statusProps.icon} label={statusProps.label} size="small" color={statusProps.color} sx={{ borderRadius: '16px', fontWeight: 500, fontSize: '0.75rem' }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton onClick={() => handleViewOpen(appointment)} color="info" size="small"><EyeOutlined /></IconButton>
                          </Tooltip>
                          <Tooltip title={appointment.status === 'completed' || appointment.status === 'cancelled' ? `Cannot update status` : "Update Status"}>
                            <span>
                              <IconButton onClick={() => handleStatusDialogOpen(appointment)} color="primary" size="small" disabled={appointment.status === 'completed' || appointment.status === 'cancelled'} >
                                <EditOutlined />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit Details / Assign Staff">
                            <IconButton onClick={() => handleOpenEditDetailDialog(appointment)} color="secondary" size="small">
                              <FormOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={!appointment.customer?.email ? "No customer email available" : "Send Confirmation Email"}>
                            <span>
                              <IconButton
                                onClick={() => handleOpenEmailConfirmation(appointment)}
                                color="success"
                                size="small"
                                disabled={!appointment.customer?.email}
                              >
                                <MailOutlined />
                              </IconButton>
                            </span>
                          </Tooltip>
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
                  <TableRow><TableCell colSpan={8} align="center">No appointments found</TableCell></TableRow>
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
          Appointment Details
          <IconButton aria-label="close" onClick={handleViewClose} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {currentAppointment && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={currentAppointment.customer?.image} alt={currentAppointment.full_name} sx={{ width: 64, height: 64 }}>
                      {!currentAppointment.customer?.image && <UserOutlined style={{ fontSize: 32 }} />}
                    </Avatar>
                    <Box>
                      <Typography variant="h5">{currentAppointment.full_name}</Typography>
                      <Typography variant="body2" color="textSecondary">{currentAppointment.phone_number}</Typography>
                      {currentAppointment.customer?.email && (<Typography variant="body2" color="textSecondary">{currentAppointment.customer.email}</Typography>)}
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Appointment Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Date</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDate(currentAppointment.appointment_date)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Time</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatTime(currentAppointment.appointment_date)} - {formatTime(currentAppointment.end_time)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Branch</Typography><Typography variant="body2">{currentAppointment.branch.name}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Status</Typography><Box sx={{ mt: 0.5 }}><Chip {...getStatusChipProps(currentAppointment.status)} size="small" /></Box></Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Staff Assigned</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Avatar src={currentAppointment.user?.image} alt={currentAppointment.user?.name} sx={{ width: 24, height: 24 }}>
                          {!(currentAppointment.user?.image) && <UserOutlined style={{ fontSize: 14 }} />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{currentAppointment.user?.name || 'Unassigned'}</Typography>
                          {currentAppointment.user?.email && (<Typography variant="caption" color="textSecondary">{currentAppointment.user.email}</Typography>)}
                        </Box>
                      </Box>
                    </Grid>
                    {currentAppointment.notes && (<Grid item xs={12}><Typography variant="caption" color="textSecondary">Notes</Typography><Typography variant="body2">{currentAppointment.notes}</Typography></Grid>)}
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Service Information</Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{currentAppointment.service.name}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Price:</Typography><Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>${currentAppointment.price?.toFixed(2)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Duration:</Typography><Typography variant="body2">{currentAppointment.service.duration} minutes</Typography></Box>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Booking Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Booking ID</Typography><Typography variant="body2">#{currentAppointment.appointment_id}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="textSecondary">Created On</Typography><Typography variant="body2">{formatDate(currentAppointment.created_at)}</Typography></Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                        <Tooltip title={currentAppointment.status === 'completed' ? `Status is 'completed'. Cannot update.` : "Update Status"}>
                          <span>
                            <Button variant="outlined" color="primary" onClick={() => handleStatusDialogOpen(currentAppointment)} disabled={currentAppointment.status === 'completed'}>Update Status</Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Edit Details / Assign Staff">
                          <Button variant="contained" color="secondary" onClick={() => { handleViewClose(); handleOpenEditDetailDialog(currentAppointment); }}>Edit Details</Button>
                        </Tooltip>
                        <Tooltip title={!currentAppointment.customer?.email ? "No customer email available" : "Send Confirmation Email"}>
                          <span>
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => { handleViewClose(); handleOpenEmailConfirmation(currentAppointment); }}
                              disabled={!currentAppointment.customer?.email}
                              startIcon={<MailOutlined />}
                            >
                              Send Email
                            </Button>
                          </span>
                        </Tooltip>
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
        <DialogTitle>Update Appointment Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Change the status for appointment #{currentAppointment?.appointment_id}</Typography>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} label="Status" onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="pending"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Pending" color="warning" sx={{ minWidth: 80 }} /><Typography variant="body2">Waiting for confirmation</Typography></Box></MenuItem>
              <MenuItem value="confirmed"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Confirmed" color="info" sx={{ minWidth: 80 }} /><Typography variant="body2">Appointment is confirmed</Typography></Box></MenuItem>
              <MenuItem value="completed"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Completed" color="success" sx={{ minWidth: 80 }} /><Typography variant="body2">Service has been provided</Typography></Box></MenuItem>
              <MenuItem value="cancelled"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Chip size="small" label="Cancelled" color="error" sx={{ minWidth: 80 }} /><Typography variant="body2">Appointment was cancelled</Typography></Box></MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} color="inherit">Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary" disabled={loading}>{loading ? 'Updating...' : 'Update Status'}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Appointment Details Dialog (bao gồm gán nhân viên) */}
      <Dialog open={editDetailDialogOpen} onClose={handleCloseEditDetailDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Appointment Details #{appointmentToEditDetails?.appointment_id}</DialogTitle>
        <DialogContent>
          {appointmentToEditDetails && (
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Customer: <strong>{appointmentToEditDetails.full_name}</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Service: {appointmentToEditDetails.service.name} on {formatDate(appointmentToEditDetails.appointment_date)} at {formatTime(appointmentToEditDetails.appointment_date)}
                </Typography>
                <Box sx={{ mt: 2, mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    Schedule Conflict Prevention: Staff members who already have appointments during this time slot will be marked as "Busy" and cannot be assigned.
                  </Typography>
                  <Typography variant="body2" color="secondary">
                    <UserOutlined style={{ marginRight: 8 }} />
                    Skill Matching: Only staff members with skills matching the service "{appointmentToEditDetails.service.name}" are shown.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="staff-select-label-edit">Assign Staff</InputLabel>
                  <Select
                    labelId="staff-select-label-edit"
                    value={selectedStaffId === null ? '' : selectedStaffId}
                    label="Assign Staff"
                    onChange={handleSelectedStaffChange}
                  >
                    <MenuItem value="">
                      <em>-- Unassign Staff --</em>
                    </MenuItem>
                    {getAvailableStaff().length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          No staff available with matching skills for this service
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
                            '&.Mui-disabled': {
                              opacity: 0.6
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={staff.imageUrl} sx={{ width: 24, height: 24 }} />
                              {staff.fullName}
                            </Box>
                            {staff.isBusy && (
                              <Chip
                                label="Busy"
                                size="small"
                                color="error"
                                sx={{ fontSize: '0.7rem', height: '20px' }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {appointmentToEditDetails && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      * Only showing staff with skills matching "{appointmentToEditDetails.service.name}"
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      * Staff marked as "Busy" already have appointments during this time slot
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
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
        <DialogActions>
          <Button onClick={handleCloseEditDetailDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSaveAppointmentDetails} variant="contained" color="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <Dialog open={emailConfirmationOpen} onClose={handleCloseEmailConfirmation} maxWidth="md" fullWidth>
        <DialogTitle>
          Send Confirmation Email
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
                    Email Preview
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This email will be sent to confirm the appointment details.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">To:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appointmentToSendEmail.customer?.email || 'No email available'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Customer:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appointmentToSendEmail.full_name}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom>Appointment Details</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Service:</Typography>
                <Typography variant="body1">{appointmentToSendEmail.service.name}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Price:</Typography>
                <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                  ${appointmentToSendEmail.price?.toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Date:</Typography>
                <Typography variant="body1">{formatDate(appointmentToSendEmail.appointment_date)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Time:</Typography>
                <Typography variant="body1">
                  {formatTime(appointmentToSendEmail.appointment_date)} - {formatTime(appointmentToSendEmail.end_time)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Staff:</Typography>
                <Typography variant="body1">
                  {appointmentToSendEmail.user?.name || 'Staff will be assigned'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Branch:</Typography>
                <Typography variant="body1">{appointmentToSendEmail.branch.name}</Typography>
              </Grid>

              {appointmentToSendEmail.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Notes:</Typography>
                  <Typography variant="body1">{appointmentToSendEmail.notes}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="body2" color="primary">
                    📧 The customer will receive a professional email with all appointment details,
                    confirmation instructions, and contact information.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmailConfirmation} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSendConfirmationEmail}
            variant="contained"
            color="primary"
            disabled={emailSending || !appointmentToSendEmail?.customer?.email}
            startIcon={emailSending ? null : <MailOutlined />}
          >
            {emailSending ? 'Sending...' : 'Send Confirmation Email'}
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
                      <strong>ID:</strong> #{appointmentToCancel.appointment_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Khách hàng:</strong> {appointmentToCancel.full_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Dịch vụ:</strong> {appointmentToCancel.service.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Thời gian:</strong> {formatDate(appointmentToCancel.appointment_date)} lúc {formatTime(appointmentToCancel.appointment_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Nhân viên:</strong> {appointmentToCancel.user?.name || 'Chưa phân công'}
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