package com.example.beautyspacms.service.impl;

import com.example.beautyspacms.dto.request.AppointmentCreateRequestDto;
import com.example.beautyspacms.dto.request.AppointmentUpdateRequestDto;
import com.example.beautyspacms.dto.response.AppointmentHistoryDto;
import com.example.beautyspacms.dto.response.AppointmentResponseDto;
import com.example.beautyspacms.entity.Appointment;
import com.example.beautyspacms.entity.Booking;
import com.example.beautyspacms.entity.ServiceHistory;
import com.example.beautyspacms.repository.AppointmentRepository;
import com.example.beautyspacms.repository.BookingRepository;
import com.example.beautyspacms.repository.ServiceHistoryRepository;
import com.example.beautyspacms.service.AppointmentService;
import com.example.beautyspacms.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentServiceImpl implements AppointmentService {
    
    private final AppointmentRepository appointmentRepository;
    private final BookingRepository bookingRepository;
    private final ServiceHistoryRepository serviceHistoryRepository;
    private final EmailService emailService;
    
    private static final String TIMEZONE = "Asia/Ho_Chi_Minh";
    private static final ZoneId ZONE_ID = ZoneId.of(TIMEZONE);

    @Override
    public AppointmentResponseDto createAppointment(AppointmentCreateRequestDto request) {
        // Implementation for create appointment
        // ... existing logic
        return null;
    }

    @Override
    public AppointmentResponseDto findByIdAndIsActive(Long appointmentId) {
        Appointment appointment = appointmentRepository.findByIdAndIsActive(appointmentId, true)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
        return convertToResponseDto(appointment);
    }

    /**
     * HỦY LỊCH HẸN - Implementation chính
     */
    @Override
    @Transactional
    public AppointmentResponseDto cancelAppointment(Long appointmentId, String reason) {
        log.info("🚫 Bắt đầu hủy lịch hẹn ID: {}, Lý do: {}", appointmentId, reason);
        
        // 1. Tìm appointment
        Appointment appointment = appointmentRepository.findByIdAndIsActive(appointmentId, true)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
        
        // 2. Kiểm tra trạng thái hiện tại
        if ("cancelled".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Lịch hẹn đã được hủy trước đó");
        }
        
        if ("completed".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Không thể hủy lịch hẹn đã hoàn thành");
        }
        
        // 3. Kiểm tra thời gian (có thể hủy trong ngày hoặc trước ngày hẹn)
        Instant now = Instant.now();
        if (appointment.getAppointmentDate().isBefore(now.atZone(ZONE_ID).toLocalDate().atStartOfDay(ZONE_ID).toInstant())) {
            // Chỉ không cho hủy nếu đã qua ngày hẹn (không tính ngày hiện tại)
            throw new IllegalArgumentException("Không thể hủy lịch hẹn đã qua ngày");
        }
        
        try {
            // 4. Cập nhật trạng thái appointment
            String oldStatus = appointment.getStatus();
            appointment.setStatus("cancelled");
            appointment.setNotes(appointment.getNotes() + " | HỦY: " + reason);
            appointment.setUpdatedAt(now);
            
            // 5. Giải phóng booking slots (tìm và xóa booking liên quan)
            List<Booking> relatedBookings = bookingRepository.findByAppointmentId(appointmentId);
            for (Booking booking : relatedBookings) {
                log.info("🗑️ Xóa booking ID: {} cho appointment ID: {}", booking.getId(), appointmentId);
                bookingRepository.delete(booking);
            }
            
            // 6. Cập nhật ServiceHistory (nếu có)
            List<ServiceHistory> serviceHistories = serviceHistoryRepository.findByAppointmentId(appointmentId);
            for (ServiceHistory history : serviceHistories) {
                history.setStatus("cancelled");
                history.setNotes(history.getNotes() + " | Hủy lịch: " + reason);
                serviceHistoryRepository.save(history);
            }
            
            // 7. Lưu appointment đã cập nhật
            Appointment savedAppointment = appointmentRepository.save(appointment);
            log.info("✅ Đã cập nhật trạng thái appointment từ '{}' thành 'cancelled'", oldStatus);
            
            // 8. Gửi email thông báo hủy lịch (async)
            try {
                sendCancellationEmail(savedAppointment, reason);
            } catch (Exception emailEx) {
                log.warn("⚠️ Không thể gửi email thông báo hủy lịch: {}", emailEx.getMessage());
                // Không throw exception vì việc hủy lịch đã thành công
            }
            
            log.info("🎉 Hủy lịch hẹn thành công - ID: {}, Lý do: {}", appointmentId, reason);
            return convertToResponseDto(savedAppointment);
            
        } catch (Exception e) {
            log.error("❌ Lỗi khi hủy lịch hẹn ID: {}", appointmentId, e);
            throw new RuntimeException("Lỗi hệ thống khi hủy lịch hẹn: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void updateAppointment(Long appointmentId, AppointmentDto dto) {
        System.out.println("---- Bắt đầu updateAppointment cho ID: " + appointmentId + " ----");
        System.out.println("DTO nhận được: " + dto.toString()); // Giả sử AppointmentDto có toString() hợp lý

        Appointment appointment = appointmentRepository.findByIdAndIsActive(appointmentId, true)
                .orElseThrow(() -> {
                    System.err.println("LỖI: Không tìm thấy lịch hẹn (ID: " + appointmentId + ") hoặc lịch hẹn không active.");
                    return new RuntimeException("Không tìm thấy lịch hẹn (ID: " + appointmentId + ") hoặc lịch hẹn không active.");
                });

        System.out.println("Appointment tìm thấy: ID=" + appointment.getId() + ", Status cũ=" + appointment.getStatus());

        String oldStatus = appointment.getStatus();
        String newStatus = dto.getStatus();
        System.out.println("Status cũ: " + oldStatus + ", Status mới từ DTO: " + newStatus);

        // 1. Cập nhật các thông tin không phải thời gian từ DTO
        if (dto.getFullName() != null) {
            System.out.println("Updating fullName: " + dto.getFullName());
            appointment.setFullName(dto.getFullName());
        }
        if (dto.getPhoneNumber() != null) {
            System.out.println("Updating phoneNumber: " + dto.getPhoneNumber());
            appointment.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getNotes() != null) {
            System.out.println("Updating notes: " + dto.getNotes());
            appointment.setNotes(dto.getNotes());
        }
        if (newStatus != null) {
            System.out.println("Updating status to: " + newStatus);
            appointment.setStatus(newStatus);
        }

        // 2. Xử lý cập nhật NGÀY và GIỜ
        boolean timeChanged = false;
        Instant newBookingStartInstant = appointment.getAppointmentDate(); // Giữ giờ cũ làm mặc định
        Integer newDurationMinutes = (appointment.getService() != null && appointment.getService().getDuration() != null)
                ? appointment.getService().getDuration()
                : 60; // Lấy duration mặc định hoặc từ service hiện tại trước

        System.out.println("Thời gian Appointment hiện tại (UTC): " + newBookingStartInstant);

        try {
            if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isEmpty() && dto.getTimeSlotId() != null) {
                System.out.println("Phát hiện yêu cầu thay đổi cả Ngày và TimeSlot.");
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                LocalDate parsedNewDate = LocalDate.parse(dto.getAppointmentDate(), formatter);
                System.out.println("Parsed new date: " + parsedNewDate);

                Timeslots newTimeSlot = timeSlotsRepository.findById(dto.getTimeSlotId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy TimeSlot mới với ID: " + dto.getTimeSlotId()));
                System.out.println("Found new TimeSlot ID: " + newTimeSlot.getSlotId() + " với startTime: " + newTimeSlot.getStartTime());

                LocalTime newSlotStartTime = newTimeSlot.getStartTime();
                if (newSlotStartTime == null) {
                    throw new RuntimeException("TimeSlot mới không có thời gian bắt đầu (startTime).");
                }

                LocalDateTime newLocalBookingStartDateTime = parsedNewDate.atTime(newSlotStartTime);
                newBookingStartInstant = newLocalBookingStartDateTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                timeChanged = true;
                appointment.setTimeSlot(newTimeSlot);
                System.out.println("Thời gian Appointment MỚI (thay đổi cả Ngày và Slot) (UTC): " + newBookingStartInstant);

            } else if (dto.getAppointmentDate() != null && !dto.getAppointmentDate().isEmpty()) {
                System.out.println("Phát hiện yêu cầu chỉ thay đổi Ngày.");
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                LocalDate parsedNewDate = LocalDate.parse(dto.getAppointmentDate(), formatter);
                System.out.println("Parsed new date: " + parsedNewDate);

                LocalTime currentSlotStartTime = appointment.getTimeSlot().getStartTime();
                System.out.println("Giữ nguyên startTime từ TimeSlot cũ: " + currentSlotStartTime);

                LocalDateTime newLocalBookingStartDateTime = parsedNewDate.atTime(currentSlotStartTime);
                newBookingStartInstant = newLocalBookingStartDateTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                timeChanged = true;
                System.out.println("Thời gian Appointment MỚI (chỉ thay đổi Ngày) (UTC): " + newBookingStartInstant);

            } else if (dto.getTimeSlotId() != null && (appointment.getTimeSlot() == null || !dto.getTimeSlotId().equals(appointment.getTimeSlot().getSlotId()))) {
                System.out.println("Phát hiện yêu cầu chỉ thay đổi TimeSlot.");
                Timeslots newTimeSlot = timeSlotsRepository.findById(dto.getTimeSlotId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy TimeSlot mới với ID: " + dto.getTimeSlotId()));
                System.out.println("Found new TimeSlot ID: " + newTimeSlot.getSlotId() + " với startTime: " + newTimeSlot.getStartTime());

                LocalTime newSlotStartTime = newTimeSlot.getStartTime();
                LocalDate currentAppointmentDatePart = LocalDateTime.ofInstant(appointment.getAppointmentDate(), ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDate();
                System.out.println("Giữ nguyên DatePart từ Appointment cũ: " + currentAppointmentDatePart);

                LocalDateTime newLocalBookingStartDateTime = currentAppointmentDatePart.atTime(newSlotStartTime);
                newBookingStartInstant = newLocalBookingStartDateTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
                timeChanged = true;
                appointment.setTimeSlot(newTimeSlot);
                System.out.println("Thời gian Appointment MỚI (chỉ thay đổi Slot) (UTC): " + newBookingStartInstant);
            }
        } catch (DateTimeParseException e) {
            System.err.println("LỖI PARSE DATE: " + e.getMessage());
            throw new RuntimeException("Định dạng ngày tháng không hợp lệ. Vui lòng sử dụng dd/MM/yyyy.", e);
        } catch (RuntimeException e) {
            System.err.println("LỖI RUNTIME khi xử lý ngày/giờ: " + e.getMessage());
            throw e; // Ném lại lỗi để controller có thể bắt và trả về 400 hoặc 500
        }

        // Cập nhật Service nếu có thay đổi
        boolean serviceChanged = false;
        if (dto.getServiceId() != null && (appointment.getService() == null || !dto.getServiceId().equals(appointment.getService().getId().longValue()))) {
            System.out.println("Phát hiện yêu cầu thay đổi Service. Old Service ID: " + (appointment.getService() != null ? appointment.getService().getId() : "null") + ", New Service ID: " + dto.getServiceId());
            org.aptech.backendmypham.models.Service newService = serviceRepository.findById(Math.toIntExact(dto.getServiceId()))
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Service với ID: " + dto.getServiceId()));
            appointment.setService(newService);
            serviceChanged = true;
            System.out.println("Đã cập nhật Service sang ID: " + newService.getId());
        }

        // Xác định durationMinutes (cần được tính toán lại nếu service hoặc DTO có duration)
        if (serviceChanged && appointment.getService() != null && appointment.getService().getDuration() != null) {
            newDurationMinutes = appointment.getService().getDuration();
            System.out.println("Duration được cập nhật từ Service mới: " + newDurationMinutes + " phút");
        } else if (dto.getDurationMinutes() != null && dto.getDurationMinutes() > 0) {
            newDurationMinutes = dto.getDurationMinutes();
            System.out.println("Duration được cập nhật từ DTO: " + newDurationMinutes + " phút");
        } else if (appointment.getService() != null && appointment.getService().getDuration() != null) {
            // Nếu service không đổi và DTO không có duration, dùng duration của service hiện tại
            newDurationMinutes = appointment.getService().getDuration();
        } else {
            Booking oldBooking = null;
            if(appointment.getUser() != null && appointment.getService() != null){
                List<Booking> bookings = bookingRepository.findByUserIdAndServiceIdAndBookingDateTimeAndIsActiveTrue(appointment.getUser().getId(), appointment.getService().getId(), appointment.getAppointmentDate());
                if(!bookings.isEmpty()) oldBooking = bookings.get(0); // Lấy booking đầu tiên khớp
            }
            newDurationMinutes = (oldBooking != null && oldBooking.getDurationMinutes() != null) ? oldBooking.getDurationMinutes() : 60;
            System.out.println("Duration giữ nguyên hoặc mặc định: " + newDurationMinutes + " phút");
        }


        if (timeChanged) { // Nếu thời gian hẹn thực sự thay đổi (ngày hoặc giờ)
            appointment.setAppointmentDate(newBookingStartInstant);
            appointment.setEndTime(newBookingStartInstant.plus(newDurationMinutes, ChronoUnit.MINUTES));
            System.out.println("Đã set AppointmentDate (UTC): " + appointment.getAppointmentDate());
            System.out.println("Đã set EndTime (UTC): " + appointment.getEndTime());
        }

        // Cập nhật User (nhân viên) nếu có thay đổi
        User staffToBook = appointment.getUser(); // Nhân viên hiện tại
        boolean staffChanged = false;

        // LOGIC ĐÃ SỬA: Xử lý gán/bỏ gán nhân viên dựa trên trạng thái mới
        if ("cancelled".equalsIgnoreCase(newStatus)) {
            // 1. KHI HỦY LỊCH: Luôn bỏ gán nhân viên để giải phóng lịch.
            if (staffToBook != null) {
                System.out.println("Trạng thái là 'cancelled'. Tự động bỏ gán nhân viên ID: " + staffToBook.getId());
                appointment.setUser(null);
                staffToBook = null; // Cập nhật biến tạm thời để logic kiểm tra sau này hiểu đúng.
                staffChanged = true;
            }
        } else if ("completed".equalsIgnoreCase(newStatus)) {
            // 2. KHI HOÀN THÀNH: Giữ lại nhân viên đã thực hiện.
            // Nếu DTO có gửi lên userId mới (trường hợp admin sửa) thì cập nhật.
            // Nếu không thì KHÔNG làm gì cả, giữ nguyên nhân viên cũ.
            System.out.println("Trạng thái là 'completed'. Sẽ giữ lại thông tin nhân viên.");
            if (dto.getUserId() != null && (staffToBook == null || !dto.getUserId().equals(staffToBook.getId()))) {
                staffToBook = userRepository.findById(dto.getUserId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy User (nhân viên) với ID: " + dto.getUserId()));
                appointment.setUser(staffToBook);
                staffChanged = true;
                System.out.println("Đã cập nhật User sang ID: " + staffToBook.getId() + " cho lịch hẹn đã hoàn thành.");
            } else {
                System.out.println("Không có userId mới trong DTO hoặc userId không đổi. Giữ nguyên nhân viên hiện tại: " + (staffToBook != null ? staffToBook.getId() : "null"));
            }
        } else {
            // 3. CÁC TRẠNG THÁI KHÁC (pending, confirmed...): Xử lý gán/bỏ gán từ DTO như bình thường.
            if (dto.getUserId() != null) {
                // Gán nhân viên mới
                if (staffToBook == null || !dto.getUserId().equals(staffToBook.getId())) {
                    staffToBook = userRepository.findById(dto.getUserId())
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy User (nhân viên) với ID: " + dto.getUserId()));
                    appointment.setUser(staffToBook);
                    staffChanged = true;
                    System.out.println("Đã cập nhật User sang ID: " + staffToBook.getId());
                }
            } else { // dto.getUserId() là null -> Yêu cầu bỏ gán tường minh từ frontend
                if (staffToBook != null) {
                    appointment.setUser(null);
                    staffToBook = null;
                    staffChanged = true;
                    System.out.println("DTO yêu cầu bỏ gán User (nhân viên) cho trạng thái '" + newStatus + "'.");
                }
            }
        }

        // 3. KIỂM TRA NHÂN VIÊN RẢNH (NẾU THỜI GIAN HOẶC NHÂN VIÊN HOẶC DỊCH VỤ THAY ĐỔI)
        boolean recheckStaffAvailability = timeChanged || staffChanged || serviceChanged;
        System.out.println("Cần kiểm tra lại lịch nhân viên không? " + recheckStaffAvailability);

        if (recheckStaffAvailability && staffToBook != null) {
            System.out.println("Đang kiểm tra lịch rảnh cho User ID: " + staffToBook.getId() +
                    " vào lúc (UTC): " + appointment.getAppointmentDate() +
                    " với duration: " + newDurationMinutes +
                    " (Loại trừ Appointment ID: " + appointmentId + ")");
            boolean staffIsActuallyAvailable = bookingService.isStaffAvailable(
                    staffToBook.getId(),
                    appointment.getAppointmentDate(),
                    newDurationMinutes,
                    appointmentId
            );
            if (!staffIsActuallyAvailable) {
                String localTimeDisplay = LocalDateTime.ofInstant(appointment.getAppointmentDate(), ZoneId.of("Asia/Ho_Chi_Minh"))
                        .format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"));
                System.err.println("LỖI: Nhân viên " + staffToBook.getFullName() + " đã có lịch vào thời điểm này (" + localTimeDisplay + " giờ VN).");
                throw new RuntimeException("Nhân viên " + staffToBook.getFullName() +
                        " đã có lịch vào thời điểm này (" + localTimeDisplay +
                        "). Vui lòng chọn thời gian hoặc nhân viên khác.");
            }
            System.out.println("Kiểm tra OK: Nhân viên " + staffToBook.getFullName() + " rảnh.");
        }

        appointment.setUpdatedAt(Instant.now());
        System.out.println("Chuẩn bị lưu Appointment: " + appointment.toString()); // Giả sử Appointment có toString()
        Appointment savedAppointment = appointmentRepository.save(appointment);
        System.out.println("Đã lưu Appointment ID: " + savedAppointment.getId());

        // 4. CẬP NHẬT HOẶC VÔ HIỆU HÓA BOOKING LIÊN QUAN

        boolean isFinalStatus = "completed".equalsIgnoreCase(newStatus) || "cancelled".equalsIgnoreCase(newStatus);
        System.out.println("Trạng thái cuối cùng (completed/cancelled)? " + isFinalStatus);
        System.out.println("Trạng thái có thực sự thay đổi sang final không? " +
                (isFinalStatus && !(oldStatus != null && (oldStatus.equalsIgnoreCase("completed") || oldStatus.equalsIgnoreCase("cancelled")))));

        if (isFinalStatus && !(oldStatus != null && (oldStatus.equalsIgnoreCase("completed") || oldStatus.equalsIgnoreCase("cancelled")))) {
            User currentStaff = savedAppointment.getUser();
            Instant currentAppointmentTime = savedAppointment.getAppointmentDate();
            org.aptech.backendmypham.models.Service currentService = savedAppointment.getService();

            if (currentStaff != null && currentAppointmentTime != null && currentService != null) {
                System.out.println("Đang tìm Booking để vô hiệu hóa: UserID=" + currentStaff.getId() +
                        ", ServiceID=" + currentService.getId() +
                        ", AppointmentTime(UTC)=" + currentAppointmentTime);

                List<Booking> bookingsToDeactivate = bookingRepository
                        .findByUserIdAndServiceIdAndBookingDateTimeAndIsActiveTrue(
                                currentStaff.getId(),
                                currentService.getId(),
                                currentAppointmentTime
                        );
                System.out.println("Tìm thấy " + bookingsToDeactivate.size() + " booking(s) để vô hiệu hóa.");

                for (Booking booking : bookingsToDeactivate) {
                    booking.setIsActive(false);
                    booking.setStatus(newStatus);
                    booking.setUpdatedAt(Instant.now());
                    bookingRepository.save(booking);
                    System.out.println("INFO: (Update) Đã vô hiệu hóa Booking ID: " + booking.getId() + " cho Appointment ID: " + savedAppointment.getId());
                }
            } else {
                System.out.println("WARN: Không đủ thông tin (User/Service/AppointmentTime) để tìm Booking cần vô hiệu hóa cho Appointment ID: " + savedAppointment.getId());
            }
        }
        System.out.println("---- Kết thúc updateAppointment cho ID: " + appointmentId + " ----");
    }

    @Override
    @Transactional
    public void deleteAppointment(Long Aid) {
        // ... existing code ...
    }

    @Override
    public List<AppointmentResponseDto> getAllAppointments() {
        List<Appointment> appointments = appointmentRepository.findByIsActiveOrderByCreatedAtDesc(true);
        return appointments.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponseDto> getAppointmentsByUserId(Long userId) {
        List<Appointment> appointments = appointmentRepository.findByUserIdAndIsActiveOrderByAppointmentDateDesc(userId, true);
        return appointments.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, List<AppointmentResponseDto>> getTodayAppointmentsGrouped() {
        LocalDate today = LocalDate.now(ZONE_ID);
        Instant startOfDay = today.atStartOfDay(ZONE_ID).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(ZONE_ID).toInstant();
        
        List<Appointment> todayAppointments = appointmentRepository.findByAppointmentDateBetweenAndIsActiveOrderByAppointmentDate(
                startOfDay, endOfDay, true);
        
        return todayAppointments.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.groupingBy(apt -> apt.getSlot()));
    }

    @Override
    public List<AppointmentHistoryDto> getAppointmentHistoryByCustomerId(Long customerId) {
        List<Appointment> appointments = appointmentRepository.findByCustomerIdAndIsActiveOrderByAppointmentDateDesc(customerId, true);
        return appointments.stream()
                .map(this::convertToAppointmentHistoryDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentHistoryDTO> getAppointmentHistoryByPhone(String phoneNumber) {
        List<Appointment> appointments = appointmentRepository.findByPhoneNumberWithDetailsOrderByCreatedAtDesc(phoneNumber, null);
        return appointments.stream()
                .map(this::convertToAppointmentHistoryDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getCustomerStats(Long customerId) {
        List<Appointment> appointments = appointmentRepository.findByCustomerIdAndIsActive(customerId, true);
        
        long totalAppointments = appointments.size();
        long completedAppointments = appointments.stream()
                .filter(apt -> "completed".equalsIgnoreCase(apt.getStatus()))
                .count();
        
        double totalSpent = appointments.stream()
                .filter(apt -> "completed".equalsIgnoreCase(apt.getStatus()))
                .mapToDouble(apt -> apt.getPrice() != null ? apt.getPrice().doubleValue() : 0.0)
                .sum();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAppointments", totalAppointments);
        stats.put("completedAppointments", completedAppointments);
        stats.put("totalSpent", totalSpent);
        
        return stats;
    }

    /**
     * Gửi email thông báo hủy lịch
     */
    private void sendCancellationEmail(Appointment appointment, String reason) {
        try {
            String customerEmail = appointment.getCustomer() != null ? 
                appointment.getCustomer().getEmail() : null;
            
            if (customerEmail == null || customerEmail.trim().isEmpty()) {
                log.warn("⚠️ Không có email khách hàng để gửi thông báo hủy lịch");
                return;
            }
            
            String subject = "Thông báo hủy lịch hẹn - Beauty Spa";
            String serviceName = appointment.getService() != null ? 
                appointment.getService().getName() : "N/A";
            String appointmentDate = appointment.getAppointmentDate()
                .atZone(ZONE_ID)
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String slot = appointment.getSlot() != null ? appointment.getSlot() : "N/A";
            
            String body = String.format(
                "Kính chào %s,\n\n" +
                "Chúng tôi xin thông báo lịch hẹn của bạn đã được hủy:\n\n" +
                "📅 Ngày hẹn: %s\n" +
                "🕐 Giờ: %s\n" +
                "💄 Dịch vụ: %s\n" +
                "📝 Lý do hủy: %s\n\n" +
                "Chúng tôi rất tiếc vì sự bất tiện này. " +
                "Bạn có thể đặt lịch mới bất cứ lúc nào qua website hoặc liên hệ hotline.\n\n" +
                "Trân trọng,\n" +
                "Beauty Spa Team",
                appointment.getFullName(),
                appointmentDate,
                slot,
                serviceName,
                reason
            );
            
            emailService.sendSimpleEmail(customerEmail, subject, body);
            log.info("📧 Đã gửi email thông báo hủy lịch đến: {}", customerEmail);
            
        } catch (Exception e) {
            log.error("❌ Lỗi khi gửi email thông báo hủy lịch: {}", e.getMessage());
        }
    }

    /**
     * Convert Appointment entity to ResponseDto
     */
    private AppointmentResponseDto convertToResponseDto(Appointment appointment) {
        AppointmentResponseDto dto = new AppointmentResponseDto();
        dto.setId(appointment.getId());
        dto.setFullName(appointment.getFullName());
        dto.setPhoneNumber(appointment.getPhoneNumber());
        dto.setAppointmentDate(appointment.getAppointmentDate());
        dto.setStatus(appointment.getStatus());
        dto.setSlot(appointment.getSlot());
        dto.setNotes(appointment.getNotes());
        dto.setPrice(appointment.getPrice());
        dto.setCreatedAt(appointment.getCreatedAt());
        dto.setUpdatedAt(appointment.getUpdatedAt());
        
        // Set service info
        if (appointment.getService() != null) {
            dto.setServiceId(appointment.getService().getId());
            dto.setServiceName(appointment.getService().getName());
        }
        
        // Set user info
        if (appointment.getUser() != null) {
            dto.setUserId(appointment.getUser().getId());
            dto.setUserName(appointment.getUser().getFullName());
        }
        
        // Set customer info
        if (appointment.getCustomer() != null) {
            dto.setCustomerId(appointment.getCustomer().getId());
        }
        
        return dto;
    }

    /**
     * Convert Appointment entity to AppointmentHistoryDto
     */
    private AppointmentHistoryDto convertToAppointmentHistoryDto(Appointment appointment) {
        AppointmentHistoryDto dto = new AppointmentHistoryDto();
        dto.setAppointmentId(appointment.getId());
        dto.setFullName(appointment.getFullName());
        dto.setPhoneNumber(appointment.getPhoneNumber());
        dto.setServicePrice(appointment.getPrice());
        dto.setStatus(appointment.getStatus());
        dto.setSlot(appointment.getSlot());
        dto.setNotes(appointment.getNotes());
        
        // Format appointment date
        if (appointment.getAppointmentDate() != null) {
            String formattedDate = appointment.getAppointmentDate()
                .atZone(ZONE_ID)
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            dto.setAppointmentDate(formattedDate);
            dto.setDisplayDate(formattedDate);
        }
        
        // Set service info
        if (appointment.getService() != null) {
            dto.setServiceId(appointment.getService().getId());
            dto.setServiceName(appointment.getService().getName());
        }
        
        // Set user info
        if (appointment.getUser() != null) {
            dto.setUserId(appointment.getUser().getId());
            dto.setUserName(appointment.getUser().getFullName());
        }
        
        return dto;
    }

    @Override
    public AppointmentStatsDTO getCustomerAppointmentStats(Long customerId) {
        List<Appointment> allAppointments = appointmentRepository.findByCustomerIdAndIsActive(customerId, null);

        Long total = (long) allAppointments.size();
        Long completed = allAppointments.stream().filter(apt -> "Đã hoàn thành".equals(determineStatusText(apt))).count();
        Long cancelled = allAppointments.stream().filter(apt -> "Đã hủy".equals(determineStatusText(apt))).count();
        Long upcoming = total - completed - cancelled;

        BigDecimal totalSpent = allAppointments.stream()
                .filter(apt -> "Đã hoàn thành".equals(determineStatusText(apt)))
                .map(Appointment::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        AppointmentStatsDTO statsDTO = new AppointmentStatsDTO();
        statsDTO.setTotalAppointments(total);
        statsDTO.setCompletedAppointments(completed);
        statsDTO.setCancelledAppointments(cancelled);
        statsDTO.setUpcomingAppointments(upcoming);
        statsDTO.setTotalSpent(totalSpent);

        return statsDTO;
    }

    private String determineStatusText(Appointment appointment) {
        // PRIORITY 1: Check explicit status from backend first
        if (appointment.getStatus() != null) {
            String status = appointment.getStatus().toLowerCase().trim();
            switch (status) {
                case "cancelled":
                    return "Đã hủy";
                case "completed":
                    return "Đã hoàn thành";
                case "confirmed":
                    return "Đã xác nhận";
                // Let "pending" fall through to date-based logic
            }
        }

        // PRIORITY 2: Date-based logic for other statuses
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate aptDate = appointment.getAppointmentDate()
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .toLocalDate();

        if (aptDate.isBefore(today)) {
            return "Đã hoàn thành"; // Past appointments, even pending, are considered "completed"
        }

        if (aptDate.isEqual(today)) {
            return "Hôm nay"; // All appointments today are "Hôm nay" unless explicitly cancelled/completed
        }

        // Future appointments
        if (appointment.getStatus() != null && "pending".equalsIgnoreCase(appointment.getStatus())) {
            return "Chờ xác nhận";
        }

        // Default for future appointments that are not pending (e.g., if we add more statuses)
        return "Sắp tới";
    }

    private String determineStatusClassName(Appointment appointment) {
        String statusText = determineStatusText(appointment);
        switch (statusText) {
            case "Đã hủy":
                return "bg-danger";
            case "Đã hoàn thành":
                return "bg-success";
            case "Đã xác nhận":
                return "bg-primary";
            case "Hôm nay":
                return "bg-warning text-dark";
            case "Chờ xác nhận":
                return "bg-secondary";
            case "Sắp tới":
            default:
                return "bg-info";
        }
    }

    private AppointmentHistoryDTO convertToAppointmentHistoryDTO(Appointment appointment) {
        return AppointmentHistoryDTO.builder()
                .appointmentId(appointment.getId())
                .fullName(appointment.getFullName())
                .phoneNumber(appointment.getPhoneNumber())
                .servicePrice(appointment.getPrice())
                .status(appointment.getStatus())
                .slot(appointment.getSlot())
                .notes(appointment.getNotes())
                .appointmentDate(DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", new Locale("vi", "VN"))
                        .withZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                        .format(appointment.getAppointmentDate()))
                .build();
    }

    @Override
    public List<AppointmentResponseDto> getALlAppointment() {
        // ... existing code ...
        return null;
    }
} 