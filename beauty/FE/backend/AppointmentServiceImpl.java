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
    public AppointmentResponseDto updateAppointment(Long appointmentId, AppointmentUpdateRequestDto request) {
        // Implementation for update appointment
        // ... existing logic
        return null;
    }

    @Override
    @Transactional
    public void deleteAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findByIdAndIsActive(appointmentId, true)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch hẹn với ID: " + appointmentId));
        
        appointment.setIsActive(false);
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);
        log.info("🗑️ Đã soft delete appointment ID: {}", appointmentId);
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
    public List<AppointmentHistoryDto> getAppointmentHistoryByPhone(String phoneNumber) {
        List<Appointment> appointments = appointmentRepository.findByPhoneNumberAndIsActiveOrderByAppointmentDateDesc(phoneNumber, true);
        return appointments.stream()
                .map(this::convertToAppointmentHistoryDto)
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
} 