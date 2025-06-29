import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from 'date-fns/locale/vi';
import { format } from 'date-fns';

registerLocale('vi', vi);

const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <div className="input-group" onClick={onClick} ref={ref} style={{ cursor: 'pointer' }}>
        <input
            type="text"
            className="form-control py-2 border-white bg-transparent text-white"
            value={value}
            placeholder={placeholder}
            readOnly
            style={{ height: '45px' }}
        />
        <span className="input-group-text bg-transparent border-white text-white">
            <i className="fas fa-calendar-alt"></i>
        </span>
    </div>
));

const validateVietnamesePhone = (phone) => {
    const cleanPhone = phone.replace(/[\s-().]/g, '');
    const patterns = [
        /^(84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/,
        /^(84|0)(2[0-9])[0-9]{8}$/,
    ];
    if (cleanPhone.length < 10 || cleanPhone.length > 11) return 'Số điện thoại phải có 10-11 số.';
    if (!/^\d+$/.test(cleanPhone)) return 'Số điện thoại chỉ được chứa các chữ số.';
    if (!patterns.some(p => p.test(cleanPhone))) return 'Định dạng số điện thoại không hợp lệ (VD: 0987654321).';
    return null;
};

const Appointment = () => {
    const navigate = useNavigate();

    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        appointmentDate: '',
        serviceId: '',
        notes: '',
        customerId: '',
        userId: '',
        branchId: '',
        timeSlotId: '',
        slot: '',
        price: '',
        status: 'pending',
    });
    const [services, setServices] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [countStaffAvaiable, setCountStaffAvaiable] = useState(0);
    const [slotInfo, setSlotInfo] = useState(null);
    // State quản lý lịch rảnh của TẤT CẢ nhân viên
    const [staffAvailabilities, setStaffAvailabilities] = useState({}); // { staffId: { isAvailable, message } }
    const [isCheckingAvailabilities, setIsCheckingAvailabilities] = useState(false);
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    const [staffSearchTerm, setStaffSearchTerm] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState(null); // To track visually selected staff
    const [strictFiltering, setStrictFiltering] = useState(true); // Enable strict skill filtering - made more intelligent
    const [scheduleFiltering, setScheduleFiltering] = useState(true); // Enable schedule filtering
    const [shiftFiltering, setShiftFiltering] = useState(true); // Enable shift filtering by default

    // Cancel appointment states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

    // Review staff states
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedStaffForReview, setSelectedStaffForReview] = useState(null);
    const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Submit appointment states
    const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    // Validation states và patterns
    const [validationErrors, setValidationErrors] = useState({});

    // Fetch services
    useEffect(() => {
        axios.get('http://localhost:8080/api/v1/services')
            .then(res => {
                setServices(Array.isArray(res.data) ? res.data : res.data.data || []);
            })
            .catch(() => setServices([]));
    }, []);

    // Fetch time slots
    useEffect(() => {
        axios.get('http://localhost:8080/api/v1/timeslot')
            .then(res => {
                const allSlots = Array.isArray(res.data) ? res.data : res.data.data || [];
                // Lọc chỉ những time slot có isActive là 1 hoặc true
                const activeSlots = allSlots.filter(slot => slot.isActive === 1 || slot.isActive === true);
                setTimeSlots(activeSlots);
            })
            .catch(() => setTimeSlots([]));
    }, []);

    // Fetch staff list based on selected service and date with schedule validation
    useEffect(() => {
        const fetchStaffList = async () => {
            // THÊM ĐIỀU KIỆN: Chỉ fetch khi đã có đầy đủ thông tin
            if (!formData.serviceId || !formData.appointmentDate || !formData.timeSlotId) {
                setStaffList([]);
                setCountStaffAvaiable(0);
                setIsLoadingSchedules(false);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                // First, get all staff
                let apiUrl = 'http://localhost:8080/api/v1/user/accounts/staff';
                let params = {};

                // Add service filter if service is selected
                if (formData.serviceId) {
                    params.serviceId = formData.serviceId;
                }

                const response = await axios.get(apiUrl, { params });
                const rawStaffList = Array.isArray(response.data) ? response.data : (response.data.data || []);

                // Get selected timeslot to determine shift
                const selectedTimeSlot = timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId);
                let requiredShift = null;

                if (selectedTimeSlot) {
                    const startHour = parseInt(selectedTimeSlot.startTime.split(':')[0]);
                    if (startHour >= 6 && startHour < 12) {
                        requiredShift = 'Sáng';
                    } else if (startHour >= 12 && startHour < 18) {
                        requiredShift = 'Chiều';
                    } else {
                        requiredShift = 'Tối';
                    }
                }

                // If date is selected, filter staff who have work schedule on that date
                let staffWithSchedule = rawStaffList;

                if (formData.appointmentDate && scheduleFiltering) {
                    setIsLoadingSchedules(true);
                    try {
                        const scheduleResponse = await axios.get('http://localhost:8080/api/v1/users-schedules', {
                            params: {
                                startDate: formData.appointmentDate,
                                endDate: formData.appointmentDate
                            }
                        });

                        const schedules = Array.isArray(scheduleResponse.data?.data)
                            ? scheduleResponse.data.data
                            : (Array.isArray(scheduleResponse.data) ? scheduleResponse.data : []);

                        const staffIdsWithSchedule = schedules
                            .filter(schedule => {
                                const workDate = schedule.workDate;
                                const requestedDate = formData.appointmentDate;
                                const isDateMatch = workDate && workDate.startsWith(requestedDate);
                                const isActive = schedule.isActive === true;
                                const isNotCompleted = schedule.status !== 'completed';

                                let isShiftMatch = true;
                                if (shiftFiltering && requiredShift && schedule.shift) {
                                    isShiftMatch = schedule.shift.toLowerCase().includes(requiredShift.toLowerCase()) ||
                                        requiredShift.toLowerCase().includes(schedule.shift.toLowerCase()) ||
                                        schedule.shift.toLowerCase() === 'full day' ||
                                        schedule.shift.toLowerCase() === 'cả ngày';
                                }
                                return isDateMatch && isActive && isNotCompleted && isShiftMatch;
                            })
                            .map(schedule => schedule.userId);

                        if (staffIdsWithSchedule.length > 0) {
                            staffWithSchedule = rawStaffList.filter(staff => staffIdsWithSchedule.includes(staff.id));
                        } else {
                            staffWithSchedule = [];
                        }

                    } catch (scheduleError) {
                        console.error("❌ Error fetching schedules:", scheduleError);
                        staffWithSchedule = rawStaffList;
                    } finally {
                        setIsLoadingSchedules(false);
                    }
                } else {
                    setIsLoadingSchedules(false);
                }

                const processedStaff = staffWithSchedule.map(staff => ({
                    ...staff,
                    isActiveResolved: staff.isActive === true || staff.isActive === 1 || String(staff.isActive).toLowerCase() === 'true'
                }));

                const filteredStaff = processedStaff.filter(staff => {
                    try {
                        if (!staff.isActiveResolved) return false;

                        if (formData.serviceId && strictFiltering) {
                            const selectedService = services.find(s => String(s.id) === formData.serviceId);
                            if (selectedService) {
                                const serviceName = String(selectedService.name || '').toLowerCase();
                                const skillsText = String(staff.skillsText || '').toLowerCase();
                                const roleName = String(staff.roleName || '').toLowerCase();

                                if (skillsText.includes(serviceName) || roleName.includes(serviceName)) {
                                    return true;
                                }

                                const serviceSkillMapping = {
                                    'facial': ['facial', 'skin', 'skincare', 'chăm sóc da'],
                                    'triệt lông': ['triệt lông', 'laser', 'hair removal', 'waxing'],
                                    'massage': ['massage', 'therapy', 'mát xa', 'trị liệu'],
                                    'hair': ['hair', 'hairstyle', 'tóc', 'cắt tóc', 'nhuộm'],
                                    'nail': ['nail', 'manicure', 'pedicure', 'móng'],
                                    'spa': ['spa', 'treatment', 'wellness', 'beauty']
                                };

                                let requiredSkills = [];
                                for (const [key, skills] of Object.entries(serviceSkillMapping)) {
                                    if (serviceName.includes(key)) {
                                        requiredSkills = skills;
                                        break;
                                    }
                                }

                                if (requiredSkills.length > 0) {
                                    const hasRequiredSkill = requiredSkills.some(skill => skillsText.includes(skill) || roleName.includes(skill));
                                    if (!hasRequiredSkill) return false;
                                }
                            }
                        }
                        return true;
                    } catch (error) {
                        console.error('Error filtering staff:', error, staff);
                        return true;
                    }
                });

                const shuffledStaff = [...filteredStaff].sort(() => 0.5 - Math.random());
                setStaffList(shuffledStaff);
            } catch (error) {
                // console.error("Error fetching staff list:", error);
                setStaffList([]);
                setCountStaffAvaiable(0);
                toast.error("Không thể tải danh sách nhân viên.");
            } finally {
                setLoading(false);
            }
        };

        fetchStaffList();
    }, [formData.serviceId, formData.appointmentDate, formData.timeSlotId, services, timeSlots, scheduleFiltering, shiftFiltering, strictFiltering]);

    // Fetch available slots
    useEffect(() => {
        if (!formData.appointmentDate || !formData.serviceId || !formData.timeSlotId) {
            setSlotInfo(null);
            return;
        }

        axios.get('http://localhost:8080/api/v1/timeslot/available', {
            params: {
                date: formData.appointmentDate,
                serviceId: formData.serviceId,
                timeSlotId: formData.timeSlotId
            }
        })
            .then(res => {
                const slotData = res.data.data;
                if (slotData && slotData.totalSlots !== undefined && slotData.bookedSlots !== undefined) {
                    const booked = Math.max(0, slotData.bookedSlots);
                    const total = Math.max(booked, slotData.totalSlots);
                    setSlotInfo({ availableSlot: booked, totalSlot: total });
                } else {
                    setSlotInfo(null);
                }
            })
            .catch(() => setSlotInfo(null));
    }, [formData.appointmentDate, formData.serviceId, formData.timeSlotId]);

    // Check staff availability
    useEffect(() => {
        const checkAllStaffAvailability = async () => {
            if (!formData.appointmentDate || !formData.timeSlotId || !formData.serviceId || staffList.length === 0) {
                setStaffAvailabilities({});
                setCountStaffAvaiable(0);
                return;
            }

            setIsCheckingAvailabilities(true);
            setStaffAvailabilities({});

            const selectedTimeSlot = timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId);
            if (!selectedTimeSlot) {
                setIsCheckingAvailabilities(false);
                return;
            }

            const [slotHours, slotMinutes] = selectedTimeSlot.startTime.split(':').map(Number);
            const [year, month, day] = formData.appointmentDate.split('-').map(Number);
            const requestedDateTimeISO = new Date(year, month - 1, day, slotHours, slotMinutes).toISOString();

            const availabilityChecks = staffList.map(staff =>
                axios.get('http://localhost:8080/api/v1/booking/staff-availability', {
                    params: {
                        userId: staff.id,
                        requestedDateTime: requestedDateTimeISO,
                        durationMinutes: 60 // Assume 60 mins, adjust if needed
                    }
                }).then(res => ({
                    staffId: staff.id,
                    isAvailable: res.data?.data?.isAvailable || false,
                })).catch(() => ({
                    staffId: staff.id,
                    isAvailable: false,
                }))
            );

            const results = await Promise.all(availabilityChecks);
            const availableStaffCount = results.filter(r => r.isAvailable).length;
            setCountStaffAvaiable(availableStaffCount);

            const newAvailabilities = results.reduce((acc, result) => {
                acc[result.staffId] = { isAvailable: result.isAvailable };
                return acc;
            }, {});

            setStaffAvailabilities(newAvailabilities);
            setIsCheckingAvailabilities(false);
        };

        checkAllStaffAvailability();
    }, [formData.appointmentDate, formData.timeSlotId, formData.serviceId, staffList, timeSlots]);

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'fullName':
                if (!value.trim()) error = 'Họ tên không được để trống';
                break;
            case 'email':
                if (!value.trim()) error = 'Email không được để trống';
                else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(value)) error = 'Định dạng email không hợp lệ';
                break;
            case 'phoneNumber':
                const validationMessage = validateVietnamesePhone(value);
                if (validationMessage) error = validationMessage;
                break;
            case 'notes':
                if (value && value.length > 500) error = 'Ghi chú không được vượt quá 500 ký tự';
                break;
            default:
                break;
        }
        setValidationErrors(prev => ({ ...prev, [name]: error }));
        return error === '';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
        const newFormData = { ...formData, [name]: value };
        if (name === 'serviceId') {
            const selectedService = services.find(s => String(s.id) === value);
            newFormData.price = selectedService ? selectedService.price : '';
        }
        setFormData(newFormData);
    };

    const handleDateChange = (date) => {
        // Backend expects 'yyyy-MM-dd'
        const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
        setFormData(prev => ({ ...prev, appointmentDate: formattedDate }));
        validateField('appointmentDate', formattedDate);
    };

    const handleStaffSelect = (staffId, event) => {
        event?.preventDefault();
        const isBusy = staffAvailabilities[staffId]?.isAvailable === false;
        if (isBusy) {
            toast.warn('Nhân viên này đang bận, vui lòng chọn nhân viên khác!');
            return;
        }
        const newStaffId = selectedStaffId === staffId ? null : staffId;
        setSelectedStaffId(newStaffId);
        setFormData(prev => ({ ...prev, userId: newStaffId }));
    };

    const handleUseAccountInfo = () => {
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (storedUserInfo) {
            setFormData(prev => ({
                ...prev,
                fullName: storedUserInfo.fullName || '',
                phoneNumber: storedUserInfo.phone || '',
                email: storedUserInfo.email || '',
                customerId: storedUserInfo.id,
            }));
        } else {
            toast.error('Không có thông tin tài khoản!');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if already submitting
        if (isSubmittingAppointment) {
            toast.warn('Đang xử lý yêu cầu, vui lòng đợi...');
            return;
        }

        // Check minimum time between submissions (3 seconds)
        const now = Date.now();
        const timeSinceLastSubmit = now - lastSubmitTime;
        if (timeSinceLastSubmit < 3000) {
            const remainingTime = Math.ceil((3000 - timeSinceLastSubmit) / 1000);
            toast.warn(`Vui lòng đợi ${remainingTime} giây trước khi thử lại.`);
            return;
        }

        setIsSubmittingAppointment(true);
        setLastSubmitTime(now);

        try {
            if (formData.userId && staffAvailabilities[formData.userId]?.isAvailable === false) {
                toast.error("Nhân viên bạn chọn đã bận vào khung giờ này. Vui lòng chọn nhân viên khác.");
                return;
            }

            let customerIdToSubmit = formData.customerId;

            if (!customerIdToSubmit && (formData.fullName && formData.phoneNumber)) {
                try {
                    const res = await axios.post('http://localhost:8080/api/v1/customers/guest-create', {
                        fullName: formData.fullName,
                        phone: formData.phoneNumber,
                        email: formData.email,
                    });
                    customerIdToSubmit = res.data.id;
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Không thể tạo khách hàng tạm!');
                    return;
                }
            }

            // Re-format date to dd/MM/yyyy for backend submission
            let formattedDate = formData.appointmentDate;
            if (formattedDate && formattedDate.includes('-')) {
                const [year, month, day] = formattedDate.split('-');
                formattedDate = `${day}/${month}/${year}`;
            }

            const submitData = {
                ...formData,
                customerId: customerIdToSubmit,
                status: formData.status || 'pending',
                appointmentDate: formattedDate, // Use the correctly formatted date
                branchId: formData.branchId || 1,
                timeSlotId: formData.timeSlotId,
                price: formData.price,
                slot: formData.slot || "1",
            };

            if (!submitData.userId) {
                delete submitData.userId;
            }

            if (!submitData.fullName || !submitData.phoneNumber || !submitData.email || !submitData.appointmentDate || !submitData.serviceId || !submitData.timeSlotId) {
                toast.error('Vui lòng điền đầy đủ các trường bắt buộc: Họ tên, SĐT, Email, Dịch vụ, Ngày hẹn, Khung giờ.');
                return;
            }

            await axios.post('http://localhost:8080/api/v1/admin/appointment/create', submitData);

            // Hiển thị thông báo thành công với thời gian chờ
            toast.success('Đặt lịch thành công! Đang chuyển hướng...', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            // Lưu thông tin để tự động tra cứu ở trang service-history
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const bookingInfo = {
                phoneNumber: formData.phoneNumber,
                fullName: formData.fullName,
                isLoggedIn: !!userInfo.id,
                timestamp: Date.now()
            };

            // Lưu thông tin đặt lịch vào sessionStorage (chỉ tồn tại trong phiên làm việc hiện tại)
            sessionStorage.setItem('recentBooking', JSON.stringify(bookingInfo));

            // Reset form after successful submission
            setFormData(prev => ({
                ...prev,
                appointmentDate: '',
                serviceId: '',
                timeSlotId: '',
                notes: '',
                userId: '',
                price: '',
            }));
            setSelectedStaffId(null);
            setStaffAvailabilities({});
            setCurrentStep(1); // Reset về step đầu tiên

            // Chuyển hướng sau 0.5 giây để người dùng có thể thấy thông báo thành công
            setTimeout(() => {
                navigate('/service-history');
            }, 500);

        } catch (error) {
            if (error.response) {
                toast.error('Đặt lịch thất bại! Lỗi: ' + (error.response.data.message || error.response.data));
            } else {
                toast.error('Đặt lịch thất bại! Vui lòng thử lại.');
            }
        } finally {
            // Reset submitting state after a delay to prevent rapid clicking
            setTimeout(() => {
                setIsSubmittingAppointment(false);
            }, 1000);
        }
    };

    // --- THAY ĐỔI: CẢI THIỆN LOGIC LỌC VÀ SẮP XẾP NHÂN VIÊN ---
    const filteredStaffList = useMemo(() => {
        try {
            let filtered = staffList || [];

            // Lọc theo từ khóa tìm kiếm
            if (staffSearchTerm?.trim()) {
                filtered = filtered.filter(staff =>
                    staff?.fullName?.toLowerCase().includes(staffSearchTerm.toLowerCase())
                );
            }

            // Sắp xếp lại: nhân viên rảnh lên đầu, bận xuống cuối
            // Chỉ sắp xếp khi có dữ liệu lịch rảnh
            if (Object.keys(staffAvailabilities).length > 0) {
                filtered.sort((a, b) => {
                    const aIsAvailable = staffAvailabilities[a.id]?.isAvailable === true;
                    const bIsAvailable = staffAvailabilities[b.id]?.isAvailable === true;
                    return bIsAvailable - aIsAvailable; // true (1) - false (0) -> b lên trước a
                });
            }

            return filtered;
        } catch (error) {
            // console.error('Error in filteredStaffList:', error);
            return [];
        }
    }, [staffList, staffSearchTerm, staffAvailabilities]);

    const renderStars = (rating) => {
        const totalStars = 5;
        const filledStars = Math.round(rating || 0);
        return Array(totalStars).fill(0).map((_, index) => (
            <span key={index} style={{ color: index < filledStars ? '#ffc107' : '#e4e5e9', fontSize: '1em' }}>
                &#9733;
            </span>
        ));
    };



    // Step validation
    const canProceedToStep = (step) => {
        // console.log("step: ", step);
        switch (step) {
            case 2:
                return formData.serviceId !== '' && formData.appointmentDate !== '' && formData.timeSlotId !== '' && (countStaffAvaiable > 0) && (slotInfo.availableSlot < slotInfo.totalSlot) && !loading;
            case 3:
                // Must have staff selected and staff must be available
                const selectedStaffAvailable = formData.userId !== '' &&
                    staffAvailabilities[formData.userId]?.isAvailable === true;
                return formData.serviceId !== '' && formData.appointmentDate !== '' &&
                    formData.timeSlotId !== '' && selectedStaffAvailable;
            case 4:
                // Check each field individually with detailed logging
                const hasServiceId = formData.serviceId !== '';
                const hasAppointmentDate = formData.appointmentDate !== '';
                const hasTimeSlotId = formData.timeSlotId !== '';
                const hasUserId = formData.userId !== '' && formData.userId != null && formData.userId !== undefined;
                const hasFullName = formData.fullName !== '' && formData.fullName?.trim() !== '';
                const hasPhoneNumber = formData.phoneNumber !== '' && formData.phoneNumber?.trim() !== '';
                const hasEmail = formData.email !== '' && formData.email?.trim() !== '';
                const noNameError = !validationErrors.fullName || validationErrors.fullName === '';
                const noPhoneError = !validationErrors.phoneNumber || validationErrors.phoneNumber === '';
                const noEmailError = !validationErrors.email || validationErrors.email === '';

                const step4Valid = hasServiceId && hasAppointmentDate && hasTimeSlotId &&
                    hasUserId && hasFullName && hasPhoneNumber && hasEmail &&
                    noNameError && noPhoneError && noEmailError;

                // console.log("🔍 Step 4 Validation DETAILED:", {
                //     serviceId: `"${formData.serviceId}" -> ${hasServiceId}`,
                //     appointmentDate: `"${formData.appointmentDate}" -> ${hasAppointmentDate}`,
                //     timeSlotId: `"${formData.timeSlotId}" -> ${hasTimeSlotId}`,
                //     userId: `${formData.userId} (type: ${typeof formData.userId}) -> ${hasUserId}`,
                //     fullName: `"${formData.fullName}" -> ${hasFullName}`,
                //     phoneNumber: `"${formData.phoneNumber}" -> ${hasPhoneNumber}`,
                //     email: `"${formData.email}" -> ${hasEmail}`,
                //     validationErrors: validationErrors,
                //     noNameError: noNameError,
                //     noPhoneError: noPhoneError,
                //     noEmailError: noEmailError,
                //     FINAL_RESULT: step4Valid
                // });

                // Show which field is failing
                if (!step4Valid) {
                    const failedFields = [];
                    if (!hasServiceId) failedFields.push('serviceId');
                    if (!hasAppointmentDate) failedFields.push('appointmentDate');
                    if (!hasTimeSlotId) failedFields.push('timeSlotId');
                    if (!hasUserId) failedFields.push('userId');
                    if (!hasFullName) failedFields.push('fullName');
                    if (!hasPhoneNumber) failedFields.push('phoneNumber');
                    if (!hasEmail) failedFields.push('email');
                    if (!noNameError) failedFields.push('fullName validation error');
                    if (!noPhoneError) failedFields.push('phoneNumber validation error');
                    if (!noEmailError) failedFields.push('email validation error');

                    // console.error("❌ Step 4 FAILED - Missing fields:", failedFields);
                }

                return step4Valid;
            default:
                return true;
        }
    };

    const handleNextStep = () => {
        console.log("🔘 NEXT BUTTON CLICKED:", {
            currentStep: currentStep,
            nextStep: currentStep + 1,
            canProceed: canProceedToStep(currentStep + 1),
            formData: {
                serviceId: formData.serviceId,
                appointmentDate: formData.appointmentDate,
                timeSlotId: formData.timeSlotId,
                userId: formData.userId,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber
            }
        });

        if (canProceedToStep(currentStep + 1)) {
            // console.log("✅ Proceeding to next step");
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        } else {
            // console.log("❌ Cannot proceed - showing error message");
            // Show specific error message based on current step
            switch (currentStep) {
                case 1:
                    toast.error('Vui lòng chọn dịch vụ, ngày hẹn và khung giờ!');
                    break;
                case 2:
                    if (!formData.userId) {
                        toast.error('Vui lòng chọn nhân viên phục vụ!');
                    } else if (staffAvailabilities[formData.userId]?.isAvailable === false) {
                        toast.error('Nhân viên đã chọn đang bận, vui lòng chọn nhân viên khác!');
                    } else {
                        toast.error('Vui lòng chọn nhân viên có lịch rảnh!');
                    }
                    break;
                case 3:
                    if (!formData.fullName || !formData.phoneNumber || !formData.email) {
                        toast.error('Vui lòng điền đầy đủ họ tên, số điện thoại và email!');
                    } else if (validationErrors.fullName || validationErrors.phoneNumber || validationErrors.email) {
                        toast.error('Vui lòng sửa lỗi trong thông tin cá nhân!');
                    }
                    break;
                default:
                    toast.error('Vui lòng hoàn thành thông tin bước hiện tại!');
            }
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Cancel appointment functions
    const handleShowCancelModal = () => {
        setShowCancelModal(true);
        setCancelReason('');
    };

    const handleCloseCancelModal = () => {
        setShowCancelModal(false);
        setCancelReason('');
        setIsSubmittingCancel(false);
    };

    const handleCancelAppointment = async () => {
        if (!cancelReason.trim()) {
            toast.warn('Vui lòng nhập lý do hủy đặt lịch.');
            return;
        }

        if (cancelReason.length > 500) {
            toast.warn('Lý do hủy không được vượt quá 500 ký tự.');
            return;
        }

        setIsSubmittingCancel(true);

        try {
            // Here you can send the cancel reason to backend if needed
            // await axios.post('http://localhost:8080/api/v1/appointment/cancel', { reason: cancelReason });

            toast.success(`Đã hủy đặt lịch thành công. Lý do: ${cancelReason}`);

            // Reset form
            setFormData({
                fullName: '',
                phoneNumber: '',
                email: '',
                appointmentDate: '',
                serviceId: '',
                notes: '',
                customerId: '',
                userId: '',
                branchId: '',
                timeSlotId: '',
                slot: '',
                price: '',
                status: 'pending',
            });
            setSelectedStaffId(null);
            setStaffAvailabilities({});
            setCurrentStep(1);
            handleCloseCancelModal();

        } catch (error) {
            toast.error('Có lỗi xảy ra khi hủy đặt lịch. Vui lòng thử lại.');
        } finally {
            setIsSubmittingCancel(false);
        }
    };



    // Step content rendering
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderServiceAndDateTime();
            case 2:
                return renderStaffSelection();
            case 3:
                return renderCustomerInfo();
            case 4:
                return renderConfirmation();
            default:
                return null;
        }
    };

    const renderServiceAndDateTime = () => (
        <div className="step-content">
            <div className="text-center mb-4">
                <h4 className="text-white mb-2">
                    <i className="fas fa-spa me-2 text-primary"></i>
                    Chọn Dịch Vụ & Thời Gian
                </h4>
                <p className="text-white-50">Lựa chọn dịch vụ và thời gian phù hợp với bạn</p>
            </div>

            <div className="row g-3">
                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-list me-2"></i>Chọn Dịch Vụ *
                    </label>
                    <select
                        name="serviceId"
                        value={formData.serviceId}
                        onChange={handleInputChange}
                        className="form-select py-2 border-white bg-transparent text-white-option"
                        style={{ height: '45px' }}
                    >
                        <option value="" style={{ color: 'black' }}>Chọn dịch vụ</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id} style={{ color: 'black' }}>
                                {service.name} - {service.price ? service.price.toLocaleString('vi-VN') : '0'}VNĐ
                            </option>
                        ))}
                    </select>
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-calendar me-2"></i>Chọn Ngày *
                    </label>
                    <DatePicker
                        locale="vi"
                        dateFormat="dd/MM/yyyy"
                        selected={formData.appointmentDate ? new Date(formData.appointmentDate.replace(/-/g, "/")) : null}
                        onChange={handleDateChange}
                        minDate={new Date()}
                        customInput={<CustomDateInput placeholder="dd/MM/yyyy" />}
                        wrapperClassName="w-100"
                        calendarClassName="custom-calendar" // for custom styling
                        popperPlacement="bottom-end"
                    />
                </div>

                <div className="col-12">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-clock me-2"></i>Chọn Khung Giờ *
                    </label>
                    <select
                        name="timeSlotId"
                        value={formData.timeSlotId}
                        onChange={handleInputChange}
                        className="form-select py-2 border-white bg-transparent text-white-option"
                        disabled={!formData.serviceId || !formData.appointmentDate}
                        style={{height: '45px'}}
                    >
                        <option value="" style={{color: 'black'}}>Chọn khung giờ</option>
                        {timeSlots.map(slot => {
                            const slotDateTimeStr = `${formData.appointmentDate}T${slot.endTime}:00`;
                            const slotEnd = new Date(slotDateTimeStr);
                            const now = new Date();
                            const isToday = formData.appointmentDate === format(now, 'yyyy-MM-dd');
                            const isPast = isToday && slotEnd <= now;

                            return (
                                <option
                                    key={slot.slotId}
                                    value={slot.slotId}
                                    disabled={isPast}
                                    style={{color: isPast ? 'gray' : 'black'}}
                                >
                                    {slot.startTime} - {slot.endTime}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {formData.appointmentDate && formData.timeSlotId && formData.serviceId && (
                    <div className={`col-12 ${loading ? 'relative' : ''}`}>
                        <div className={`${loading ? 'loader' : ''}`}></div>
                        <div className=" alert alert-info bg-transparent border-white text-white rounded-3 shadow-sm">
                            <div className={`${loading ? 'background-blur' : ''}`}>
                                <div className="d-flex align-items-center justify-content-between flex-wrap">
                                    <div className="d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center">
                                            <i className="fas fa-user-friends me-2"></i>
                                            <strong>Nhân viên sẵn sàng phục vụ:</strong>
                                            <span className={`badge ms-2 px-2 py-1 rounded-pill ${countStaffAvaiable > 2 ? 'bg-success' :
                                                countStaffAvaiable > 0 ? 'bg-warning text-dark' :
                                                    'bg-danger'
                                                }`} style={{ fontSize: '0.8rem' }}>
                                                <i className="fas fa-users me-1"></i>
                                                {countStaffAvaiable} người
                                            </span>
                                        </div>

                                        {slotInfo && (
                                            <div className="d-flex align-items-center">
                                                <i className="fas fa-bookmark me-2"></i>
                                                <span className="me-2">Đã đặt:</span>
                                                <span
                                                    className={`badge px-2 py-1 rounded-pill ${slotInfo.availableSlot === slotInfo.totalSlot ? 'bg-danger' :
                                                        slotInfo.availableSlot > slotInfo.totalSlot / 2 ? 'bg-warning text-dark' :
                                                            'bg-success'
                                                        }`} style={{ fontSize: '0.8rem' }}>
                                                    <i className="fas fa-calendar-check me-1"></i>
                                                    {slotInfo.availableSlot} / {slotInfo.totalSlot} chỗ
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {countStaffAvaiable > 0 && (
                                        <div className="d-flex flex-column align-items-end gap-1">
                                            <small className="text-white-50 mb-1">Tình trạng sẵn sàng</small>
                                            <div className="progress rounded-pill" style={{ width: '180px', height: '10px' }}>
                                                <div
                                                    className={`progress-bar progress-bar-striped progress-bar-animated ${countStaffAvaiable === 0 ? 'bg-danger' :
                                                        countStaffAvaiable <= 2 ? 'bg-warning' :
                                                            'bg-success'
                                                        }`}
                                                    style={{
                                                        width: `${Math.min((countStaffAvaiable / 5) * 100, 100)}%`,
                                                        borderRadius: '10px'
                                                    }}
                                                    role="progressbar"
                                                    aria-valuenow={countStaffAvaiable}
                                                    aria-valuemin="0"
                                                    aria-valuemax="5"
                                                />
                                            </div>
                                            <small className="text-white-50" style={{ fontSize: '0.7rem' }}>
                                                {countStaffAvaiable === 0 ? 'Chưa có nhân viên' :
                                                    countStaffAvaiable <= 2 ? 'Ít nhân viên' :
                                                        'Đủ nhân viên'}
                                            </small>
                                        </div>
                                    )}
                                </div>

                                {/* Thêm thông báo rõ ràng thân thiện với người dùng */}
                                <div className="mt-3 pt-2 border-top border-white" style={{ borderOpacity: '0.3' }}>
                                    <div className="d-flex align-items-center text-white-50">
                                        <i className="fas fa-info-circle me-2"></i>
                                        <small>
                                            {staffList.length === 0 ?
                                                'Hiện tại chưa có nhân viên nào có lịch làm việc vào thời gian này. Vui lòng chọn thời gian khác.' :
                                                slotInfo?.availableSlot === slotInfo?.totalSlot ?
                                                    'Thời gian này đã kín lịch. Vui lòng chọn khung giờ khác.' :
                                                    slotInfo?.availableSlot === slotInfo?.totalSlot - 1 ?
                                                        'Chỉ còn 1 chỗ trống cuối cùng! Hãy nhanh tay đặt lịch.' :
                                                        slotInfo?.availableSlot < slotInfo?.totalSlot ?
                                                            `Còn ${slotInfo.totalSlot - slotInfo.availableSlot} chỗ trống. Bạn có thể đặt lịch ngay!` :
                                                            'Nhân viên đã sẵn sàng phục vụ bạn!'
                                            }
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStaffSelection = () => (
        <div className="step-content">
            <div className="text-center mb-4">
                <h4 className="text-white mb-2">
                    <i className="fas fa-user-tie me-2 text-primary"></i>
                    Chọn Nhân Viên
                </h4>
                <p className="text-white-50">Lựa chọn nhân viên phục vụ bạn</p>
            </div>

            <div className="row mb-3">
                <div className="col-12 col-md-6">
                    <div className="position-relative">
                        <div className="position-absolute top-50 start-0 translate-middle-y ms-2" style={{ zIndex: 10 }}>
                            <i className="fas fa-search text-white-50"></i>
                        </div>
                        <input
                            type="text"
                            className="form-control py-2 bg-transparent text-white custom-placeholder"
                            placeholder="Tìm kiếm nhân viên..."
                            value={staffSearchTerm}
                            onChange={(e) => setStaffSearchTerm(e.target.value)}
                            style={{
                                color: 'white',
                                height: '40px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '5px',
                                paddingLeft: '35px'
                            }}
                        />
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="d-flex flex-column align-items-md-end">
                        {(isCheckingAvailabilities || isLoadingSchedules) && (
                            <div className="text-info">
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                {isLoadingSchedules ? 'Đang tải lịch làm việc...' : 'Đang kiểm tra lịch rảnh nhân viên...'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="staff-directory-grid">
                {filteredStaffList.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="fas fa-user-times text-white-50 mb-3" style={{ fontSize: '2rem' }}></i>
                        <h5 className="text-white mb-3">Không có nhân viên phù hợp</h5>
                        <div className="text-white-50">
                            {staffSearchTerm ? (
                                <p>Không tìm thấy nhân viên với từ khóa "<strong>{staffSearchTerm}</strong>"</p>
                            ) : (
                                <div>
                                    <p className="mb-2">Không có nhân viên nào có:</p>
                                    <ul className="list-unstyled">
                                        <li><i className="fas fa-calendar-check me-2"></i>Lịch làm việc vào {formData.appointmentDate || 'ngày đã chọn'}</li>
                                        {shiftFiltering && formData.timeSlotId && (() => {
                                            const selectedTimeSlot = timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId);
                                            if (selectedTimeSlot) {
                                                const startHour = parseInt(selectedTimeSlot.startTime.split(':')[0]);
                                                let currentShift = '';
                                                if (startHour >= 6 && startHour < 12) {
                                                    currentShift = 'Sáng';
                                                } else if (startHour >= 12 && startHour < 18) {
                                                    currentShift = 'Chiều';
                                                } else {
                                                    currentShift = 'Tối';
                                                }
                                                return (
                                                    <li><i className="fas fa-user-clock me-2"></i>Ca làm việc phù hợp (Ca {currentShift})</li>
                                                );
                                            }
                                            return null;
                                        })()}
                                        {strictFiltering && formData.serviceId && (
                                            <li><i className="fas fa-tools me-2"></i>Kỹ năng phù hợp với dịch vụ "{services.find(s => String(s.id) === formData.serviceId)?.name}"</li>
                                        )}
                                        {formData.timeSlotId && (
                                            <li><i className="fas fa-clock me-2"></i>Khung giờ rảnh vào {timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId)?.startTime}</li>
                                        )}
                                    </ul>
                                    <div className="mt-3">
                                        <div className="alert alert-warning bg-transparent border-warning text-warning small mb-3">
                                            <i className="fas fa-info-circle me-2"></i>
                                            <div className="mb-2">
                                                <strong>Hệ thống đang tìm kiếm:</strong>
                                                <ul className="mb-1 mt-1">
                                                    <li>Nhân viên có lịch làm việc trong ngày đã chọn</li>
                                                    {shiftFiltering && (
                                                        <li>Nhân viên có ca làm việc phù hợp với thời gian đã chọn</li>
                                                    )}
                                                    <li>Nhân viên có thể phục vụ dịch vụ được chọn</li>
                                                </ul>
                                            </div>
                                            <strong>Gợi ý:</strong>
                                            <span> Thử chọn thời gian khác hoặc ngày khác để xem thêm nhân viên phù hợp.</span>
                                        </div>
                                        <small className="text-warning">
                                            <i className="fas fa-lightbulb me-1"></i>
                                            Hoặc liên hệ trực tiếp với spa để được hỗ trợ
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="row g-3">
                        {filteredStaffList.map(staff => {
                            const isSelected = selectedStaffId === staff.id;
                            const isBusy = staffAvailabilities[staff.id]?.isAvailable === false;

                            return (
                                <div key={staff.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                    <div
                                        className={`employee-card h-100 p-3 border rounded-3 position-relative ${isSelected ? 'border-primary selected-card' :
                                            isBusy ? 'border-danger busy-card' : 'border-light'
                                            }`}
                                        style={{
                                            backgroundColor: isBusy ? 'rgba(220, 53, 69, 0.1)' :
                                                isSelected ? 'rgba(13, 110, 253, 0.1)' :
                                                    'rgba(255,255,255,0.05)',
                                            cursor: isBusy ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease-in-out',
                                            opacity: isBusy ? 0.6 : 1,
                                            minHeight: '220px'
                                        }}
                                        onClick={(e) => handleStaffSelect(staff.id, e)}
                                    >
                                        {/* Status Badge */}
                                        <div className="position-absolute top-0 end-0 m-2">
                                            {isBusy ? (
                                                <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>
                                                    <i className="fas fa-times me-1"></i>Bận
                                                </span>
                                            ) : isSelected ? (
                                                <span className="badge bg-primary" style={{ fontSize: '0.65rem' }}>
                                                    <i className="fas fa-check me-1"></i>Đã chọn
                                                </span>
                                            ) : (
                                                <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>
                                                    <i className="fas fa-circle me-1"></i>Rảnh
                                                </span>
                                            )}
                                        </div>

                                        {/* Employee Info */}
                                        <div className="text-center">
                                            <img
                                                src={staff.imageUrl || '/default-avatar.png'}
                                                alt={staff.fullName}
                                                className="rounded-circle border border-white mb-3"
                                                style={{
                                                    width: '70px',
                                                    height: '70px',
                                                    objectFit: 'cover',
                                                    borderWidth: '2px !important'
                                                }}
                                            />

                                            <h6 className="text-white mb-1" style={{
                                                fontSize: '0.95rem',
                                                fontWeight: '600',
                                                minHeight: '22px'
                                            }}>
                                                {staff.fullName}
                                            </h6>

                                            <p className="text-white-50 mb-1" style={{
                                                fontSize: '0.75rem',
                                                minHeight: '18px',
                                                maxHeight: '38px',                             
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                            {staff.skillsText || 'Chuyên viên Spa'}
                                        </p>

                                        {/* Rating */}
                                        <div className="d-flex align-items-center justify-content-center mb-2">
                                            <div className="me-2">
                                                {renderStars(staff.averageRating)}
                                            </div>
                                            <span className="text-white-50" style={{ fontSize: '0.65rem' }}>
                                                ({staff.totalReviews || 0})
                                            </span>
                                        </div>

                                        {/* Review Button */}
                                        <div className="mb-3">
                                            <Link
                                                to={`/staff-review/${staff.id}`}
                                                className="btn btn-sm btn-warning w-100"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '6px 12px',
                                                    textDecoration: 'none',
                                                    fontWeight: '600',
                                                    color: '#212529',
                                                    backgroundColor: '#ffc107',
                                                    border: '1px solid #ffc107',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
                                                }}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#ffcd39';
                                                    e.target.style.borderColor = '#ffcd39';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.5)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#ffc107';
                                                    e.target.style.borderColor = '#ffc107';
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)';
                                                }}
                                            >
                                                <i className="fas fa-star me-1"></i>Đánh giá
                                            </Link>
                                        </div>

                                        {/* Select Button */}
                                        <button
                                            type="button"
                                            className={`btn btn-sm w-100 ${isBusy ? 'btn-outline-danger' :
                                                isSelected ? 'btn-primary' : 'btn-outline-light'
                                                }`}
                                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                                            disabled={isBusy}
                                            onClick={(e) => handleStaffSelect(staff.id, e)}
                                        >
                                            {isBusy ? (
                                                <><i className="fas fa-ban me-1"></i>Không có</>
                                            ) : isSelected ? (
                                                <><i className="fas fa-check me-1"></i>Đã chọn</>
                                            ) : (
                                                <><i className="fas fa-hand-pointer me-1"></i>Chọn</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                </div>
                );
                        })}
            </div>
                )}
        </div>
        </div >
    );

const renderCustomerInfo = () => {
    // Kiểm tra trạng thái đăng nhập
    const isLoggedIn = localStorage.getItem('userInfo') !== null;

    return (
        <div className="step-content">
            <div className="text-center mb-4">
                <h4 className="text-white mb-2">
                    <i className="fas fa-user me-2 text-primary"></i>
                    Thông Tin Khách Hàng
                </h4>
                <p className="text-white-50">Vui lòng điền thông tin liên hệ của bạn</p>
            </div>

            <div className="row g-3">
                {/* Chỉ hiện nút khi đã đăng nhập */}
                {isLoggedIn && (
                    <div className="col-12">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUseAccountInfo();
                            }}
                            className="btn btn-outline-light w-100 mb-3"
                            style={{ height: '45px' }}
                        >
                            <i className="fas fa-user-circle me-2"></i>
                            Sử dụng thông tin tài khoản
                        </button>
                    </div>
                )}

                {/* Hiển thị thông báo khuyến khích đăng nhập nếu chưa đăng nhập */}
                {!isLoggedIn && (
                    <div className="col-12">
                        <div className="alert alert-info bg-transparent border-white text-white mb-3">
                            <div className="d-flex align-items-center">
                                <i className="fas fa-info-circle me-2"></i>
                                <div>
                                    <strong>Gợi ý:</strong> Đăng nhập để tự động điền thông tin và theo dõi lịch hẹn của bạn
                                    {/* <a href="/login" className="btn btn-sm btn-outline-light ms-2">
                                            <i className="fas fa-sign-in-alt me-1"></i>
                                            Đăng nhập
                                        </a> */}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-user me-2"></i>Họ và Tên *
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`form-control py-2 border-white bg-transparent text-white custom-placeholder ${validationErrors.fullName ? 'border-danger' : ''}`}
                        placeholder="Nhập họ và tên của bạn"
                        style={{ color: 'white', height: '45px' }}
                    />
                    {validationErrors.fullName && (
                        <small className="text-danger mt-1 d-block">{validationErrors.fullName}</small>
                    )}
                </div>

                <div className="col-12 col-lg-6">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-phone me-2"></i>Số Điện Thoại *
                    </label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`form-control py-2 border-white bg-transparent text-white custom-placeholder ${validationErrors.phoneNumber ? 'border-danger' : ''}`}
                        placeholder="Nhập số điện thoại hợp lệ"
                        maxLength="15"
                        style={{ color: 'white', height: '45px' }}
                    />
                    {validationErrors.phoneNumber && (
                        <small className="text-danger mt-1 d-block">{validationErrors.phoneNumber}</small>
                    )}
                </div>

                <div className="col-12">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-envelope me-2"></i>Email *
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`form-control py-2 border-white bg-transparent text-white custom-placeholder ${validationErrors.email ? 'border-danger' : ''}`}
                        placeholder="Nhập email của bạn"
                        style={{ color: 'white', height: '45px' }}
                    />
                    {validationErrors.email && (
                        <small className="text-danger mt-1 d-block">{validationErrors.email}</small>
                    )}
                </div>

                <div className="col-12">
                    <label className="form-label text-white fw-bold">
                        <i className="fas fa-comment me-2"></i>Ghi Chú
                    </label>
                    <div className="position-relative">
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className={`form-control border-white bg-transparent text-white custom-placeholder ${validationErrors.notes ? 'border-danger' : ''}`}
                            rows="4"
                            placeholder="Ghi chú thêm về yêu cầu của bạn (không bắt buộc)"
                            maxLength="500"
                            style={{
                                color: 'white',
                                resize: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                        <div className="d-flex justify-content-between align-items-center mt-1">
                            {/* {validationErrors.notes && (
                                    <small className={`${formData.notes?.length > 500 ? 'text-danger' : formData.notes?.length > 450 ? 'text-warning' : 'text-info'}`}>
                                        <i className="fas fa-exclamation-circle me-1"></i>
                                        {validationErrors.notes}
                                    </small>
                                )} */}
                            <small className={`ms-auto ${formData.notes?.length >= 500 ? 'text-danger fw-bold' :
                                formData.notes?.length > 450 ? 'text-warning fw-bold' :
                                    formData.notes?.length > 400 ? 'text-info' : 'text-white-50'
                                }`} style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-edit me-1"></i>
                                {formData.notes?.length || 0}/500 ký tự
                                {formData.notes?.length >= 500 && <span className="ms-1">⚠️ Đã đạt giới hạn!</span>}
                                {formData.notes?.length > 450 && formData.notes?.length < 500 && <span className="ms-1">⚠️ Gần hết!</span>}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const renderConfirmation = () => {
    const selectedService = services.find(s => String(s.id) === formData.serviceId);
    const selectedTimeSlot = timeSlots.find(ts => String(ts.slotId) === formData.timeSlotId);
    const selectedStaff = staffList.find(s => s.id === selectedStaffId);

    return (
        <div className="step-content">
            <div className="text-center mb-4">
                <h4 className="text-white mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    <i className="fas fa-check-double me-2 text-success"></i>
                    Xác Nhận Thông Tin Đặt Lịch
                </h4>
                <p style={{
                    color: '#f8f9fa',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
                    fontSize: '1rem'
                }}>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</p>
            </div>

            {/* Summary Card */}
            <div className="confirmation-summary mb-4 p-4 rounded-3" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                <div className="row g-4">
                    {/* Dịch Vụ */}
                    <div className="col-12 col-md-6">
                        <div className="border-start border-success border-3 ps-3">
                            <h6 className="text-success mb-1" style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                <i className="fas fa-spa me-2"></i>Dịch Vụ
                            </h6>
                            <p className="mb-1 fw-bold" style={{
                                color: '#ffffff',
                                fontSize: '1.1rem',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}>{selectedService?.name}</p>
                            <p className="mb-0" style={{
                                color: '#e9ecef',
                                fontSize: '1rem',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                Thời gian: {selectedService?.duration || '60'} phút
                                <br />
                                Giá: {selectedService?.price ? selectedService.price.toLocaleString('vi-VN') : '0'} VNĐ
                            </p>
                        </div>
                    </div>

                    {/* Nhân Viên */}
                    <div className="col-12 col-md-6">
                        <div className="border-start border-3 ps-3" style={{ borderColor: '#FDB5B9' }}>
                            <h6 className="mb-1" style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                                color: '#FDB5B9'
                            }}>
                                <i className="fas fa-user-tie me-2"></i>Nhân Viên
                            </h6>
                            <p className="mb-1 fw-bold" style={{
                                color: '#ffffff',
                                fontSize: '1.1rem',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}>{selectedStaff?.fullName || 'Sẽ được phân công'}</p>
                            {selectedStaff && (
                                <p className="mb-0" style={{
                                    color: '#e9ecef',
                                    fontSize: '1rem',
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                                }}>
                                    {selectedStaff?.skillsText || 'Chuyên viên Spa'}
                                    <br />
                                    <span className="d-inline-flex align-items-center">
                                        {renderStars(selectedStaff?.averageRating)}
                                        <span className="ms-2">({selectedStaff?.totalReviews || 0} xem đánh giá)</span>
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointment Details */}
            <div className="appointment-details mb-4 p-4 rounded-3" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)'
            }}>
                <h5 className="text-primary mb-3 fw-bold">
                    <i className="fas fa-info-circle me-2 text-primary"></i>
                    Chi Tiết Cuộc Hẹn
                </h5>

                <div className="row g-3">
                    {/* Ngày & Giờ */}
                    <div className="col-12 col-md-6">
                        <div className="border-start border-info border-3 ps-3">
                            <h6 className="text-info mb-1" style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                <i className="fas fa-calendar-alt me-2"></i>Ngày & Giờ
                            </h6>
                            <p className="mb-1 fw-bold" style={{
                                color: '#ffffff',
                                fontSize: '1.1rem',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}>
                                {(() => {
                                    if (formData.appointmentDate) {
                                        const [year, month, day] = formData.appointmentDate.split('-');
                                        const date = new Date(year, month - 1, day);
                                        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                                        return date.toLocaleDateString('vi-VN', options);
                                    }
                                    return formData.appointmentDate;
                                })()}
                            </p>
                            <p className="mb-0" style={{
                                color: '#e9ecef',
                                fontSize: '1rem',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                Khung giờ: {selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}
                            </p>
                        </div>
                    </div>

                    {/* Khách Hàng */}
                    <div className="col-12 col-md-6">
                        <div className="border-start border-warning border-3 ps-3">
                            <h6 className="text-warning mb-1" style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                <i className="fas fa-user me-2"></i>Khách Hàng
                            </h6>
                            <p className="mb-1 fw-bold" style={{
                                color: '#ffffff',
                                fontSize: '1.1rem',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                            }}>{formData.fullName}</p>
                            <p className="mb-0" style={{
                                color: '#e9ecef',
                                fontSize: '1rem',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                {formData.phoneNumber}
                                <br />
                                {formData.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {formData.notes && (
                    <div className="mt-3">
                        <div className="border-start border-warning border-3 ps-3">
                            <h6 className="text-warning mb-1" style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                <i className="fas fa-sticky-note me-2"></i>Ghi Chú
                            </h6>
                            <div className="text-white fst-italic" style={{
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                wordWrap: 'break-word',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto',
                                maxHeight: '120px',
                                overflowY: 'auto',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                            }}>
                                {formData.notes}
                            </div>
                        </div>

                        {/* Custom scrollbar styling */}
                        <style jsx>{`
                                .mt-3 div:last-child::-webkit-scrollbar {
                                    width: 4px;
                                }
                                
                                .mt-3 div:last-child::-webkit-scrollbar-track {
                                    background: rgba(255,255,255,0.1);
                                    border-radius: 2px;
                                }
                                
                                .mt-3 div:last-child::-webkit-scrollbar-thumb {
                                    background: rgba(255,193,7,0.5);
                                    border-radius: 2px;
                                }
                                
                                .mt-3 div:last-child::-webkit-scrollbar-thumb:hover {
                                    background: rgba(255,193,7,0.7);
                                }
                            `}</style>
                    </div>
                )}
            </div>

            {/* Total Cost */}
            <div className="total-cost p-4 rounded-3" style={{
                background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.2) 0%, rgba(40, 167, 69, 0.1) 100%)',
                border: '2px solid rgba(40, 167, 69, 0.5)',
                backdropFilter: 'blur(15px)'
            }}>
                <div className="border-start border-success border-3 ps-3">
                    <h6 className="text-success mb-1" style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                    }}>
                        <i className="fas fa-receipt me-2"></i>Tổng Chi Phí
                    </h6>
                    <div className="d-flex justify-content-between align-items-center">
                        <p className="mb-0" style={{
                            color: '#e9ecef',
                            fontSize: '1rem',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                        }}>
                            Đã bao gồm tất cả phí dịch vụ
                        </p>
                        <h2 className="mb-0 fw-bold text-end" style={{
                            color: '#28a745',
                            fontSize: '2.5rem',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                        }}>
                            {selectedService?.price ? selectedService.price.toLocaleString('vi-VN') : '0'}
                            <span style={{ fontSize: '1.5rem' }}> VNĐ</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* Warning Notice */}
            <div className="alert alert-warning bg-transparent border-warning text-warning mt-4">
                <div className="d-flex align-items-start">
                    <i className="fas fa-exclamation-triangle me-2 mt-1"></i>
                    <div>
                        <strong>Lưu ý quan trọng:</strong>
                        <ul className="mb-0 mt-2" style={{ fontSize: '0.9rem' }}>
                            <li>Vui lòng có mặt đúng giờ để đảm bảo chất lượng dịch vụ tốt nhất</li>
                            <li>Nếu cần thay đổi lịch hẹn, vui lòng liên hệ trước ít nhất 2 tiếng</li>
                            <li>Thanh toán có thể thực hiện bằng tiền mặt hoặc chuyển khoản tại spa</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- BẮT ĐẦU PHẦN GIAO DIỆN (JSX) ---
return (
    <div className="container-fluid appointment py-5">
        <ToastContainer />
        <div className="container py-5">
            {/* Header */}
            <div className="text-center mb-5">
                <p className="fs-4 text-uppercase" style={{
                    color: '#ffffff',
                    fontWeight: '600',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    letterSpacing: '1px'
                }}>Liên Hệ Với Chúng Tôi</p>
                <h1 className="display-5 display-lg-4 mb-3" style={{
                    color: '#ffffff',
                    fontWeight: '700',
                    textShadow: '3px 3px 6px rgba(0,0,0,0.8)'
                }}>Đặt Lịch Hẹn</h1>
                <p style={{
                    color: '#f8f9fa',
                    fontSize: '1.1rem',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
                    fontWeight: '500'
                }}>Đặt lịch hẹn spa chỉ với 4 bước đơn giản</p>
            </div>

            {/* Progress Steps */}
            <div className="row justify-content-center mb-4">
                <div className="col-lg-10 col-12">
                    <div className="step-progress-container">
                        <div className="d-flex justify-content-between align-items-center step-progress-wrapper">
                            {[1, 2, 3, 4].map(step => (
                                <div key={step} className="d-flex flex-column align-items-center step-item">
                                    <div
                                        className={`step-circle ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                                    >
                                        {currentStep > step ? (
                                            <i className="fas fa-check"></i>
                                        ) : (
                                            step
                                        )}
                                    </div>
                                    <small className="mt-2 text-center step-label">
                                        {step === 1 && 'Dịch Vụ & Thời Gian'}
                                        {step === 2 && 'Chọn Nhân Viên'}
                                        {step === 3 && 'Thông Tin Cá Nhân'}
                                        {step === 4 && 'Xác Nhận'}
                                    </small>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-5 justify-content-center">
                <div className="col-lg-10 col-12">
                    <div
                        className="appointment-form p-3 p-lg-4 position-relative overflow-hidden"
                        style={{
                            height: 'auto',
                            minHeight: '600px',
                            maxWidth: '100%',
                            background: 'rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            zIndex: 5
                        }}
                    >
                        <form
                            onSubmit={handleSubmit}
                            onKeyDown={(e) => {
                                // Ngăn form auto-submit khi nhấn Enter
                                if (e.key === 'Enter' && e.target.type !== 'submit') {
                                    e.preventDefault();
                                    // Nếu đang ở step cuối và nhấn Enter, mới cho submit
                                    if (currentStep === totalSteps && e.target.type === 'submit') {
                                        handleSubmit(e);
                                    }
                                }
                            }}
                        >
                            {/* Step Content */}
                            {renderStepContent()}

                            {/* Navigation Buttons */}
                            <div className="row mt-4">
                                <div className="col-12">
                                    <div className="d-flex justify-content-between navigation-buttons-wrapper">
                                        <button
                                            type="button"
                                            className="btn custom-btn prev-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handlePrevStep();
                                            }}
                                            disabled={currentStep === 1}
                                            style={{ minWidth: '120px' }}
                                        >
                                            <i className="fas fa-chevron-left me-2"></i>
                                            Quay Lại
                                        </button>

                                        {currentStep < totalSteps ? (
                                            <button
                                                type="button"
                                                className="btn custom-btn next-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleNextStep();
                                                }}
                                                disabled={!canProceedToStep(currentStep + 1)}
                                                style={{ minWidth: '120px' }}
                                            >
                                                Tiếp Theo
                                                <i className="fas fa-chevron-right ms-2"></i>
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                className="btn custom-btn submit-btn"
                                                style={{ minWidth: '180px' }}
                                                disabled={isSubmittingAppointment || !canProceedToStep(4)}
                                            >
                                                {isSubmittingAppointment ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin me-2"></i>
                                                        Đang Xử Lý...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-check me-2"></i>
                                                        Xác Nhận Đặt Lịch
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        {/* Cancel Appointment Modal */}
        {showCancelModal && (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div className="modal-content" style={{
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    padding: '30px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}>
                    <div className="modal-header text-center mb-4">
                        <h4 className="text-danger mb-2">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Hủy đặt lịch
                        </h4>
                        <p className="text-muted mb-0">Vui lòng cho chúng tôi biết lý do hủy đặt lịch</p>
                    </div>

                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Lý do hủy đặt lịch *</label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="form-control"
                                rows={4}
                                placeholder="Vui lòng nhập lý do hủy đặt lịch (tối đa 500 ký tự)..."
                                maxLength={500}
                                style={{
                                    resize: 'vertical',
                                    fontSize: '0.95rem'
                                }}
                            />
                            <div className="d-flex justify-content-between mt-1">
                                <small className="text-muted">* Bắt buộc</small>
                                <small className={`${cancelReason.length > 450 ? 'text-warning' : 'text-muted'}`}>
                                    {cancelReason.length}/500 ký tự
                                </small>
                            </div>
                        </div>

                        {/* Quick reason buttons */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">Lý do thường gặp:</label>
                            <div className="d-flex flex-wrap gap-2">
                                {[
                                    'Thay đổi lịch trình',
                                    'Vấn đề sức khỏe',
                                    'Có việc đột xuất',
                                    'Thay đổi ý định',
                                    'Không phù hợp thời gian'
                                ].map((reason, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setCancelReason(reason);
                                        }}
                                        style={{
                                            borderRadius: '15px',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer d-flex justify-content-center gap-3">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCloseCancelModal();
                            }}
                            className="btn btn-secondary"
                            style={{
                                borderRadius: '20px',
                                padding: '10px 25px',
                                fontWeight: '600'
                            }}
                            disabled={isSubmittingCancel}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Quay lại
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCancelAppointment();
                            }}
                            className="btn btn-danger"
                            style={{
                                borderRadius: '20px',
                                padding: '10px 25px',
                                fontWeight: '600'
                            }}
                            disabled={isSubmittingCancel || !cancelReason.trim()}
                        >
                            {isSubmittingCancel ? (
                                <>
                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                    Đang hủy...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check me-2"></i>
                                    Xác nhận hủy
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}



        {/* Global CSS */}
        <style jsx global>{`
                /* Step Progress Styles */
                .step-progress-container {
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(15px);
                    border-radius: 15px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                    position: relative;
                    z-index: 10;
                }

                .step-progress-wrapper {
                    position: relative;
                    padding: 0 25px;
                }

                .step-progress-wrapper::before {
                    content: '';
                    position: absolute;
                    top: 25px;
                    left: 50px;
                    right: 50px;
                    height: 3px;
                    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
                    border-radius: 2px;
                    z-index: 1;
                }

                .step-item {
                    position: relative;
                    z-index: 3;
                    flex: 1;
                    max-width: 130px;
                }

                .step-circle {
                    width: 55px;
                    height: 55px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0, 0, 0, 0.3);
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: bold;
                    border: 3px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.4s ease;
                    margin: 0 auto;
                    font-size: 1.1rem;
                    position: relative;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .step-circle::before {
                    content: '';
                    position: absolute;
                    inset: -3px;
                    border-radius: 50%;
                    padding: 3px;
                    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }

                .step-circle.active {
                    background: linear-gradient(135deg, #FDB5B9, #f89ca0);
                    color: white;
                    border-color: #FDB5B9;
                    box-shadow: 0 0 25px rgba(253, 181, 185, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3);
                    transform: scale(1.1);
                }

                .step-circle.active::before {
                    opacity: 1;
                }

                .step-circle.completed {
                    background: linear-gradient(135deg, #198754, #0f5132);
                    color: white;
                    border-color: #198754;
                    box-shadow: 0 0 20px rgba(25, 135, 84, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3);
                    transform: scale(1.05);
                }

                .step-circle.completed::before {
                    opacity: 1;
                }

                .step-label {
                    color: #ffffff;
                    font-weight: 600;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                    font-size: 0.85rem;
                }

                /* Step Content Styles */
                .step-content {
                    min-height: 500px;
                    padding: 20px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(5px);
                }

                /* Confirmation Card */
                .confirmation-card {
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }

                /* Custom Navigation Buttons */
                .navigation-buttons-wrapper {
                    padding: 20px 0;
                    gap: 20px;
                }

                .custom-btn {
                    position: relative;
                    padding: 15px 30px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 1rem;
                    border: none;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(10px);
                }

                .custom-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transition: left 0.5s ease;
                }

                .custom-btn:hover::before {
                    left: 100%;
                }

                .custom-btn i {
                    transition: transform 0.3s ease;
                }

                /* Previous Button */
                .prev-btn {
                    background: linear-gradient(135deg, #6c757d, #495057);
                    color: white;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }

                .prev-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #495057, #343a40);
                    box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
                    transform: translateY(-2px);
                    color: white;
                }

                .prev-btn:hover:not(:disabled) i {
                    transform: translateX(-3px);
                }

                .prev-btn:disabled {
                    background: linear-gradient(135deg, rgba(108, 117, 125, 0.4), rgba(73, 80, 87, 0.4));
                    color: rgba(255, 255, 255, 0.5);
                    cursor: not-allowed;
                    border-color: rgba(255, 255, 255, 0.1);
                }

                /* Next Button */
                .next-btn {
                    background: linear-gradient(135deg, #FDB5B9, #f89ca0);
                    color: white;
                    border: 2px solid rgba(253, 181, 185, 0.3);
                    box-shadow: 0 4px 15px rgba(253, 181, 185, 0.3);
                }

                .next-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #F7A8B8, #E589A3);
                    box-shadow: 0 6px 25px rgba(253, 181, 185, 0.6);
                    transform: translateY(-2px);
                    color: white;
                }

                .next-btn:hover:not(:disabled) i {
                    transform: translateX(3px);
                }

                .next-btn:disabled {
                    background: linear-gradient(135deg, rgba(253, 181, 185, 0.4), rgba(247, 168, 184, 0.4));
                    color: rgba(255, 255, 255, 0.5);
                    cursor: not-allowed;
                    border-color: rgba(253, 181, 185, 0.1);
                    box-shadow: none;
                }

                /* Submit Button */
                .submit-btn {
                    background: linear-gradient(135deg, #28a745, #1e7e34);
                    color: white;
                    border: 2px solid rgba(40, 167, 69, 0.3);
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                    animation: subtle-pulse 2s ease-in-out infinite alternate;
                }

                .submit-btn:hover {
                    background: linear-gradient(135deg, #1e7e34, #155724);
                    box-shadow: 0 6px 25px rgba(40, 167, 69, 0.6);
                    transform: translateY(-2px);
                    color: white;
                }

                .submit-btn:hover:not(:disabled) i {
                    transform: scale(1.1);
                }

                .submit-btn:disabled {
                    background: linear-gradient(135deg, rgba(40, 167, 69, 0.4), rgba(30, 126, 52, 0.4)) !important;
                    color: rgba(255, 255, 255, 0.6) !important;
                    cursor: not-allowed !important;
                    border-color: rgba(40, 167, 69, 0.2) !important;
                    box-shadow: none !important;
                    transform: none !important;
                    animation: none !important;
                }

                .submit-btn:disabled i {
                    transform: none !important;
                }

                @keyframes subtle-pulse {
                    0% {
                        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                    }
                    100% {
                        box-shadow: 0 4px 20px rgba(40, 167, 69, 0.6);
                    }
                }

                /* Responsive and custom styles */
                @media (max-width: 767.98px) {
                    .appointment-form {
                        height: auto !important;
                        min-height: 600px !important;
                        padding: 1rem !important;
                        background: rgba(0, 0, 0, 0.4) !important;
                        backdropFilter: blur(10px) !important;
                    }

                    .display-4 {
                        font-size: 2rem !important;
                    }

                    .step-progress-container {
                        padding: 15px;
                        background: rgba(0, 0, 0, 0.5);
                    }

                    .step-progress-wrapper {
                        padding: 0 10px;
                    }

                    .step-progress-wrapper::before {
                        left: 30px;
                        right: 30px;
                        height: 2px;
                    }

                    .step-item {
                        max-width: 80px;
                    }

                    .step-circle {
                        width: 45px;
                        height: 45px;
                        font-size: 0.9rem;
                    }

                    .step-label {
                        font-size: 0.7rem;
                    }

                    .navigation-buttons-wrapper {
                        flex-direction: column;
                        gap: 15px;
                    }

                    .custom-btn {
                        min-width: 100%;
                        padding: 12px 25px;
                        font-size: 0.9rem;
                    }
                }

                .text-white-option {
                    color: white !important;
                }

                .text-white-option option {
                    color: black !important;
                    background-color: white !important;
                }

                .text-white-option option:disabled {
                    color: #999 !important;
                }

                .form-control.custom-placeholder::placeholder {
                    color: #ccc;
                    opacity: 1;
                }

                .form-control.custom-placeholder:-ms-input-placeholder {
                    color: #ccc;
                }

                .form-control.custom-placeholder::-ms-input-placeholder {
                    color: #ccc;
                }

                .custom-date-picker::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                }

                /* Employee Directory Card Styles */
                .employee-card {
                    transition: all 0.3s ease-in-out;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                    backdrop-filter: blur(10px);
                }

                .employee-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
                    border-color: rgba(255, 255, 255, 0.4) !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                }

                .employee-card.selected-card {
                    border-color: #FDB5B9 !important;
                    background: rgba(253, 181, 185, 0.15) !important;
                    box-shadow: 0 0 20px rgba(253, 181, 185, 0.3) !important;
                }

                .employee-card.busy-card {
                    border-color: #dc3545 !important;
                    background: rgba(220, 53, 69, 0.1) !important;
                    opacity: 0.6;
                }

                /* Staff Directory Grid */
                .staff-directory-grid {
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 10px;
                    border-radius: 10px;
                    background: rgba(0, 0, 0, 0.1);
                }

                .staff-directory-grid::-webkit-scrollbar {
                    width: 6px;
                }

                .staff-directory-grid::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }

                .staff-directory-grid::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                }

                .staff-directory-grid::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }

                /* Cancel Modal Animation */
                .modal-overlay {
                    animation: fadeIn 0.3s ease-out;
                }

                .modal-content {
                    animation: slideInUp 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Cancel reason buttons */
                .btn-outline-secondary:hover {
                    background-color: #6c757d;
                    border-color: #6c757d;
                    color: white;
                }

                /* Mobile responsiveness for cancel modal */
                @media (max-width: 767.98px) {
                    .modal-content {
                        margin: 20px;
                        padding: 20px;
                        max-width: none;
                        width: calc(100% - 40px);
                    }

                    .modal-footer {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .modal-footer .btn {
                        width: 100%;
                    }
                }
            `}</style>
    </div>
);
};

export default Appointment;