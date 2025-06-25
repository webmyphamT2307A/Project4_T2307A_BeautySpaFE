package com.example.beautyspacms.controller;

import com.example.beautyspacms.dto.request.AppointmentCancelRequestDto;
import com.example.beautyspacms.dto.request.AppointmentCreateRequestDto;
import com.example.beautyspacms.dto.request.AppointmentUpdateRequestDto;
import com.example.beautyspacms.dto.response.AppointmentHistoryDto;
import com.example.beautyspacms.dto.response.AppointmentResponseDto;
import com.example.beautyspacms.dto.response.ResponseObject;
import com.example.beautyspacms.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/appointment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {
    
    private final AppointmentService appointmentService;

    /**
     * Tạo appointment mới
     */
    @PostMapping("/create")
    public ResponseEntity<ResponseObject> createAppointment(
            @RequestBody AppointmentCreateRequestDto request) {
        try {
            AppointmentResponseDto appointment = appointmentService.createAppointment(request);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Tạo lịch hẹn thành công");
            response.setData(appointment);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi tạo lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Lấy thông tin appointment theo ID
     */
    @GetMapping("/findById")
    public ResponseEntity<ResponseObject> getAppointmentById(@RequestParam Long AiD) {
        try {
            AppointmentResponseDto appointment = appointmentService.findByIdAndIsActive(AiD);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Lấy thông tin lịch hẹn thành công");
            response.setData(appointment);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Không tìm thấy lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * HỦY LỊCH HẸN - Endpoint chính cho chức năng cancel
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ResponseObject> cancelAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) AppointmentCancelRequestDto cancelRequest) {
        try {
            String reason = null;
            if (cancelRequest != null) {
                reason = cancelRequest.getReason();
            }
            
            // Validate reason
            if (reason == null || reason.trim().isEmpty()) {
                ResponseObject response = new ResponseObject();
                response.setStatus("ERROR");
                response.setMessage("Lý do hủy lịch hẹn không được để trống");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (reason.length() > 500) {
                ResponseObject response = new ResponseObject();
                response.setStatus("ERROR");
                response.setMessage("Lý do hủy lịch hẹn không được vượt quá 500 ký tự");
                return ResponseEntity.badRequest().body(response);
            }

            // Gọi service để hủy appointment
            AppointmentResponseDto cancelledAppointment = appointmentService.cancelAppointment(id, reason);
            
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Hủy lịch hẹn thành công. Lý do: " + reason);
            response.setData(cancelledAppointment);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi hủy lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Cập nhật appointment
     */
    @PutMapping("/update")
    public ResponseEntity<ResponseObject> updateAppointment(
            @RequestParam Long AiD,
            @RequestBody AppointmentUpdateRequestDto request) {
        try {
            AppointmentResponseDto appointment = appointmentService.updateAppointment(AiD, request);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Cập nhật lịch hẹn thành công");
            response.setData(appointment);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi cập nhật lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Xóa appointment (soft delete)
     */
    @PutMapping("/delete")
    public ResponseEntity<ResponseObject> deleteAppointment(@RequestParam Long AiD) {
        try {
            appointmentService.deleteAppointment(AiD);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Xóa lịch hẹn thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi xóa lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Lấy tất cả appointments
     */
    @GetMapping("")
    public ResponseEntity<ResponseObject> getAllAppointments() {
        try {
            List<AppointmentResponseDto> appointments = appointmentService.getAllAppointments();
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Lấy danh sách lịch hẹn thành công");
            response.setData(appointments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi lấy danh sách lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Lấy appointments theo user ID
     */
    @GetMapping("/byUser")
    public ResponseEntity<ResponseObject> getAppointmentsByUserId(@RequestParam Long userId) {
        try {
            List<AppointmentResponseDto> appointments = appointmentService.getAppointmentsByUserId(userId);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Lấy lịch hẹn theo user thành công");
            response.setData(appointments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi lấy lịch hẹn theo user: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Lấy appointments theo ngày (với grouping ca)
     */
    @GetMapping("/today")
    public ResponseEntity<ResponseObject> getTodayAppointments() {
        try {
            Map<String, List<AppointmentResponseDto>> appointments = appointmentService.getTodayAppointmentsGrouped();
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Lấy lịch hẹn hôm nay thành công");
            response.setData(appointments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi lấy lịch hẹn hôm nay: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Lấy lịch sử appointment theo customer ID
     */
    @GetMapping("/history/customer/{customerId}")
    public ResponseEntity<ResponseObject> getAppointmentHistoryByCustomerId(@PathVariable Long customerId) {
        try {
            List<AppointmentHistoryDto> history = appointmentService.getAppointmentHistoryByCustomerId(customerId);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Lấy lịch sử lịch hẹn thành công");
            response.setData(history);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi lấy lịch sử lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Lấy lịch sử appointment theo số điện thoại
     */
    @GetMapping("/history/phone/{phoneNumber}")
    public ResponseEntity<ResponseObject> getAppointmentHistoryByPhone(@PathVariable String phoneNumber) {
        try {
            List<AppointmentHistoryDto> history = appointmentService.getAppointmentHistoryByPhone(phoneNumber);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Lấy lịch sử lịch hẹn thành công");
            response.setData(history);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi lấy lịch sử lịch hẹn: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Lấy thống kê customer
     */
    @GetMapping("/stats/customer/{customerId}")
    public ResponseEntity<ResponseObject> getCustomerStats(@PathVariable Long customerId) {
        try {
            Map<String, Object> stats = appointmentService.getCustomerStats(customerId);
            ResponseObject response = new ResponseObject();
            response.setStatus("SUCCESS");
            response.setMessage("Lấy thống kê khách hàng thành công");
            response.setData(stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ResponseObject response = new ResponseObject();
            response.setStatus("ERROR");
            response.setMessage("Lỗi khi lấy thống kê khách hàng: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
} 