package org.aptech.backendmypham.controllers;

import org.aptech.backendmypham.models.ResponseObject;
import org.aptech.backendmypham.services.StatisticService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/statistics")
public class StatisticController {

    private final StatisticService statisticService;

    public StatisticController(StatisticService statisticService) {
        this.statisticService = statisticService;
    }

    @GetMapping("/role-ratings")
    @Operation(summary = "Lấy đánh giá trung bình theo từng vai trò")
    public ResponseEntity<ResponseObject> getRoleRatings(@RequestParam(required = false, defaultValue = "this_month") String period) {
        return ResponseEntity.ok(
                new ResponseObject(Status.SUCCESS, "Lấy đánh giá theo vai trò thành công.", statisticService.getRoleRatingsByPeriod(period))
        );
    }

    @GetMapping("/customers-by-month")
    @Operation(summary = "Lấy dữ liệu số lượng khách hàng theo tháng (Admin/Nhân viên)")
    // ... existing code ...
} 