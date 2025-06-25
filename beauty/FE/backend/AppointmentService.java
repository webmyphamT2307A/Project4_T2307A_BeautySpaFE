package com.example.beautyspacms.service;

import com.example.beautyspacms.dto.request.AppointmentCreateRequestDto;
import com.example.beautyspacms.dto.request.AppointmentUpdateRequestDto;
import com.example.beautyspacms.dto.response.AppointmentHistoryDto;
import com.example.beautyspacms.dto.response.AppointmentResponseDto;

import java.util.List;
import java.util.Map;

public interface AppointmentService {
    
    /**
     * Tạo appointment mới
     */
    AppointmentResponseDto createAppointment(AppointmentCreateRequestDto request);
    
    /**
     * Tìm appointment theo ID (chỉ active)
     */
    AppointmentResponseDto findByIdAndIsActive(Long appointmentId);
    
    /**
     * HỦY LỊCH HẸN - Method chính cho chức năng cancel
     */
    AppointmentResponseDto cancelAppointment(Long appointmentId, String reason);
    
    /**
     * Cập nhật appointment
     */
    AppointmentResponseDto updateAppointment(Long appointmentId, AppointmentUpdateRequestDto request);
    
    /**
     * Xóa appointment (soft delete)
     */
    void deleteAppointment(Long appointmentId);
    
    /**
     * Lấy tất cả appointments
     */
    List<AppointmentResponseDto> getAllAppointments();
    
    /**
     * Lấy appointments theo user ID
     */
    List<AppointmentResponseDto> getAppointmentsByUserId(Long userId);
    
    /**
     * Lấy appointments hôm nay theo ca
     */
    Map<String, List<AppointmentResponseDto>> getTodayAppointmentsGrouped();
    
    /**
     * Lấy lịch sử appointment theo customer ID
     */
    List<AppointmentHistoryDto> getAppointmentHistoryByCustomerId(Long customerId);
    
    /**
     * Lấy lịch sử appointment theo số điện thoại
     */
    List<AppointmentHistoryDto> getAppointmentHistoryByPhone(String phoneNumber);
    
    /**
     * Lấy thống kê customer
     */
    Map<String, Object> getCustomerStats(Long customerId);
} 