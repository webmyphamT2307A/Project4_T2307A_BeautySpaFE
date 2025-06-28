import org.aptech.backendmypham.dto.DailyReportDto;
import org.aptech.backendmypham.dto.ResponseObject;
import org.aptech.backendmypham.enums.Status;
import org.aptech.backendmypham.services.StatisticService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

public interface StatisticService {
    DashboardSummaryDto getAdminDashboardSummary();
    DashboardSummaryDto getStaffDashboardSummary(Long userId);
    List<ChartDataDto> getRevenueByMonth(int year, Long userId);
    List<ChartDataDto> getRevenueByYear();
    List<RoleRatingDto> getRoleRatings();
    List<RoleRatingDto> getRoleRatingsByPeriod(String period);
    List<ChartDataDto> getCustomerCountByMonth(int year,Long userId);
    List<ChartDataDto> getCustomerCountByYear();
    List<ChartDataDto> getMyMonthlyRatings(int year, Long userId);
    List<DailyCustomerReportDto> getDailyCustomerReport(int year, int month);
    DailyReportDto getDailyDetailedReport(LocalDate date);
} 