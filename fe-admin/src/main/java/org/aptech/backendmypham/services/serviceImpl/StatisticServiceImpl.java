package org.aptech.backendmypham.services.serviceImpl;

import org.aptech.backendmypham.models.Review;
import org.aptech.backendmypham.models.User;
import org.aptech.backendmypham.services.StatisticService;
import org.aptech.backendmypham.models.dto.ChartDataDto;
import org.aptech.backendmypham.models.dto.RoleRatingDto;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Required;
import java.time.YearMonth;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticServiceImpl implements StatisticService {

    @Override
    public List<RoleRatingDto> getRoleRatingsByPeriod(String period) {
        YearMonth currentMonth = YearMonth.now(VIETNAM_ZONE);
        YearMonth targetMonth = "last_month".equalsIgnoreCase(period) ? currentMonth.minusMonths(1) : currentMonth;

        Instant startOfPeriod = targetMonth.atDay(1).atStartOfDay(VIETNAM_ZONE).toInstant();
        Instant endOfPeriod = targetMonth.atEndOfMonth().atTime(LocalTime.MAX).atZone(VIETNAM_ZONE).toInstant();

        // Assuming a method exists in ReviewRepository to fetch reviews for users in a specific period
        List<Review> reviewsInPeriod = reviewRepository.findByTypeAndCreatedAtBetween("USER_REVIEW", startOfPeriod, endOfPeriod);

        if (reviewsInPeriod.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> userIds = reviewsInPeriod.stream()
                .map(Review::getRelatedId)
                .collect(Collectors.toSet());

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        Map<String, List<Review>> reviewsByRole = reviewsInPeriod.stream()
                .filter(review -> {
                    User user = userMap.get(review.getRelatedId());
                    return user != null && user.getRole() != null;
                })
                .collect(Collectors.groupingBy(review -> userMap.get(review.getRelatedId()).getRole().getName()));

        return reviewsByRole.entrySet().stream().map(entry -> {
            String roleName = entry.getKey();
            List<Review> roleReviews = entry.getValue();
            double avgRating = roleReviews.stream()
                    .mapToDouble(Review::getRating)
                    .average()
                    .orElse(0.0);
            return new RoleRatingDto(roleName, avgRating, roleReviews.size());
        }).collect(Collectors.toList());
    }

    @Override
    public List<ChartDataDto> getCustomerCountByMonth(int year,Long userId) {

    }
} 