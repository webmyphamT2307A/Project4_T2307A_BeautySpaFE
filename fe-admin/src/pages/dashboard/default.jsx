import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, Box, Avatar, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Tab, Tabs, ButtonGroup, Button,
  Divider, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText,
  LinearProgress, Badge, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions
} from '@mui/material';
import {
  CalendarOutlined, TeamOutlined, UserOutlined, ClockCircleOutlined,
  DollarOutlined, StarOutlined, LineChartOutlined, BarChartOutlined,
  CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, EnvironmentOutlined,
  ScheduleOutlined, ShopOutlined, RiseOutlined, FallOutlined, EyeOutlined,
  LeftOutlined, RightOutlined, CalendarTwoTone
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import ReportAreaChart from 'sections/dashboard/default/ReportAreaChart';
import MonthlyBarChart from 'sections/dashboard/default/MonthlyBarChart';
import { format, addDays, isSameDay, isToday, subYears } from 'date-fns';
import './dashboard.css';

// Mock data - normally would come from API
import { staffList, branchData, serviceData } from './mockData';

const DashboardDefault = () => {
  // States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [waitingCustomers, setWaitingCustomers] = useState(0);
  const [servedCustomers, setServedCustomers] = useState(0);
  const [calendarData, setCalendarData] = useState([]);
  const [totalServices, setTotalServices] = useState(0);
  const [ratingData, setRatingData] = useState([]);
  const [ratingPeriod, setRatingPeriod] = useState(0); // 0 for current month, 1 for last month
  const [customerChartData, setCustomerChartData] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('month'); // 'month' or 'year'
  const [currentShift, setCurrentShift] = useState('');
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [customerGrowth, setCustomerGrowth] = useState('+12.5%');
  const [revenueGrowth, setRevenueGrowth] = useState('+18.3%');
  const [totalMonthlyRevenue, setTotalMonthlyRevenue] = useState(0);
  const [totalMonthlyCustomers, setTotalMonthlyCustomers] = useState(0);
  const [revenueTimeFrame, setRevenueTimeFrame] = useState('month');
  const [customerTimeFrame, setCustomerTimeFrame] = useState('month');
  // New loading states for charts
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  // State for calendar day modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);

  const username = localStorage.getItem('username') || 'Admin';

  // Update current time every minute
  useEffect(() => {
    // Set initial time and shift
    const now = new Date();
    setCurrentTime(now);
    setCurrentShift(determineShift(now));

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setCurrentShift(determineShift(now));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const determineShift = (time) => {
    const hour = time.getHours();
    if (hour >= 8 && hour < 12) {
      return 'Morning (8:00-12:00)';
    } else if (hour >= 12 && hour < 17) {
      return 'Afternoon (12:00-17:00)';
    } else if (hour >= 17 && hour < 21) {
      return 'Evening (17:00-21:00)';
    } else {
      return 'Closed (21:00-8:00)';
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchScheduleData();
    fetchCustomerStats();
    fetchCalendarData();
    fetchTotalServices();
    fetchRatingData();
    fetchChartData();
    fetchTodayAppointments();
  }, []);

  // Fetch data when rating period changes
  useEffect(() => {
    fetchRatingData();
  }, [ratingPeriod]);

  // Fetch data when time frame changes
  useEffect(() => {
    fetchChartData();
  }, [timeFrame]);

  // Refetch calendar data when selected month changes
  useEffect(() => {
    fetchCalendarData();
  }, [selectedMonth]);

  // Separate useEffect for each chart
  useEffect(() => {
    fetchRevenueChartData();
  }, [revenueTimeFrame]);

  useEffect(() => {
    fetchCustomerChartData();
  }, [customerTimeFrame]);

  const fetchRevenueChartData = () => {
    setRevenueLoading(true); // Start loading

    setTimeout(() => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      if (revenueTimeFrame === 'month') {
        // Monthly view for revenue chart
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Generate revenue data for each month
        const revenueData = months.map((month, index) => {
          const isPastMonth = index <= currentMonth;

          // Seasonal patterns
          let baseRevenue;
          if ([11, 0, 1].includes(index)) { // Winter months
            baseRevenue = 75000 + Math.random() * 15000;
          } else if ([2, 3, 4].includes(index)) { // Spring months
            baseRevenue = 90000 + Math.random() * 20000;
          } else if ([5, 6, 7].includes(index)) { // Summer months
            baseRevenue = 110000 + Math.random() * 25000;
          } else { // Fall months
            baseRevenue = 95000 + Math.random() * 18000;
          }

          const finalRevenue = isPastMonth
            ? Math.round(baseRevenue)
            : Math.round(baseRevenue * 0.85 + Math.random() * baseRevenue * 0.3);

          return {
            name: month,
            data: finalRevenue
          };
        });

        setTotalMonthlyRevenue(revenueData.reduce((sum, item) => sum + item.data, 0));
        setRevenueChartData(revenueData);
      } else {
        // Yearly view for revenue chart
        const years = [];
        for (let i = 4; i >= 0; i--) {
          years.push(currentYear - i);
        }
        years.sort((a, b) => a - b);

        // Generate revenue data with growth trend over years
        const revenueData = years.map((year, index) => {
          const baseRevenue = 800000 + (index * 250000) + (Math.random() * 100000);
          return {
            name: year.toString(),
            data: Math.round(baseRevenue)
          };
        });

        // Calculate revenue growth
        if (revenueData.length >= 2) {
          const currentYearRevenue = revenueData[revenueData.length - 1].data;
          const prevYearRevenue = revenueData[revenueData.length - 2].data;
          const revGrowthPercentage = ((currentYearRevenue - prevYearRevenue) / prevYearRevenue * 100).toFixed(1);
          setRevenueGrowth(`${revGrowthPercentage > 0 ? '+' : ''}${revGrowthPercentage}%`);
        }

        setRevenueChartData(revenueData);
      }

      setRevenueLoading(false); // End loading
    }, 600); // Increased timeout for visible loading effect
  };

  const fetchCustomerChartData = () => {
    setCustomerLoading(true); // Start loading

    setTimeout(() => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      if (customerTimeFrame === 'month') {
        // Monthly view for customer chart
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const customerData = months.map((month, index) => {
          const isPastMonth = index <= currentMonth;

          // Seasonal patterns
          let baseCustomers;
          if ([11, 0, 1].includes(index)) { // Winter
            baseCustomers = 220 + Math.random() * 80;
          } else if ([2, 3, 4].includes(index)) { // Spring
            baseCustomers = 280 + Math.random() * 100;
          } else if ([5, 6, 7].includes(index)) { // Summer
            baseCustomers = 350 + Math.random() * 120;
          } else { // Fall
            baseCustomers = 300 + Math.random() * 90;
          }

          const finalCustomers = isPastMonth
            ? Math.round(baseCustomers)
            : Math.round(baseCustomers * 0.9 + Math.random() * baseCustomers * 0.2);

          return {
            name: month,
            data: finalCustomers
          };
        });

        setTotalMonthlyCustomers(customerData.reduce((sum, item) => sum + item.data, 0));
        setCustomerChartData(customerData);
      } else {
        // Yearly view for customer chart
        const years = [];
        for (let i = 4; i >= 0; i--) {
          years.push(currentYear - i);
        }
        years.sort((a, b) => a - b);

        const customerData = years.map((year, index) => {
          const baseCustomers = 2000 + (index * 500) + (Math.random() * 400);
          return {
            name: year.toString(),
            data: Math.round(baseCustomers)
          };
        });

        // Calculate customer growth
        if (customerData.length >= 2) {
          const currentYearCustomers = customerData[customerData.length - 1].data;
          const prevYearCustomers = customerData[customerData.length - 2].data;
          const custGrowthPercentage = ((currentYearCustomers - prevYearCustomers) / prevYearCustomers * 100).toFixed(1);
          setCustomerGrowth(`${custGrowthPercentage > 0 ? '+' : ''}${custGrowthPercentage}%`);
        }

        setCustomerChartData(customerData);
      }

      setCustomerLoading(false); // End loading
    }, 600); // Increased timeout for visible loading effect
  };

  // Mock API calls - these can be replaced with actual API calls later
  const fetchScheduleData = () => {
    setTimeout(() => {
      const statuses = ['On Time', 'Late', 'Working'];
      const shifts = ['Morning (8:00-12:00)', 'Afternoon (12:00-17:00)', 'Evening (17:00-21:00)'];

      const mockData = staffList.map((staff, idx) => ({
        ...staff,
        shift: shifts[idx % 3],
        work_date: format(currentTime, 'yyyy-MM-dd'),
        check_in_time: `${8 + (idx % 3)}:${idx % 4 === 0 ? '00' : idx % 4 === 1 ? '15' : idx % 4 === 2 ? '30' : '45'}`,
        check_out_time: null,
        status: statuses[idx % 3],
        branch: branchData[idx % branchData.length].name,
        is_active: true
      }));

      // Filter for current shift
      const filteredData = mockData.filter(staff => {
        const shiftName = currentShift.split(' ')[0]; // Extract 'Morning', 'Afternoon', or 'Evening'
        return staff.shift.includes(shiftName);
      });

      setScheduleData(filteredData);
    }, 300);
  };

  const fetchCustomerStats = () => {
    setTimeout(() => {
      // Morning shift typically has 5-10 waiting, Afternoon 8-15, Evening 3-8
      let waiting = 0;
      const shiftName = currentShift.split(' ')[0];

      if (shiftName === 'Morning') {
        waiting = Math.floor(Math.random() * 6) + 5;
      } else if (shiftName === 'Afternoon') {
        waiting = Math.floor(Math.random() * 8) + 8;
      } else if (shiftName === 'Evening') {
        waiting = Math.floor(Math.random() * 6) + 3;
      }

      // Served customers increases throughout the day
      const hour = currentTime.getHours();
      const baseServed = hour < 12 ? 8 : hour < 17 ? 20 : 35;
      const served = baseServed + Math.floor(Math.random() * 10);

      setWaitingCustomers(waiting);
      setServedCustomers(served);
    }, 300);
  };

  const fetchCalendarData = () => {
    setTimeout(() => {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      const today = new Date();

      // Generate realistic distribution - weekends busier than weekdays
      const days = [];
      for (let day = new Date(startOfMonth); day <= endOfMonth; day.setDate(day.getDate() + 1)) {
        // Skip future dates if viewing current month
        if (selectedMonth.getMonth() === today.getMonth() &&
          selectedMonth.getFullYear() === today.getFullYear() &&
          day > today) {
          continue;
        }

        const date = format(day, 'yyyy-MM-dd');
        const dayOfMonth = day.getDate();
        const dayOfWeek = day.getDay(); // 0 is Sunday, 6 is Saturday

        // Weekends are busier
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const baseCustomers = isWeekend ? 25 : 15;
        const totalCustomers = baseCustomers + Math.floor(Math.random() * 12);

        // Distribution across shifts (morning usually less busy than afternoon/evening)
        const shifts = {
          Morning: Math.floor(totalCustomers * 0.25),
          Afternoon: Math.floor(totalCustomers * 0.45),
          Evening: Math.floor(totalCustomers * 0.3)
        };

        // Ensure the sum matches totalCustomers
        const sum = shifts.Morning + shifts.Afternoon + shifts.Evening;
        if (sum < totalCustomers) {
          shifts.Afternoon += (totalCustomers - sum);
        }

        days.push({
          date,
          dayOfMonth,
          dayOfWeek,
          isWeekend,
          totalCustomers,
          shifts
        });
      }

      setCalendarData(days);
    }, 300);
  };

  const fetchTotalServices = () => {
    setTimeout(() => {
      // More realistic service count based on calendar data
      const totalCustomers = calendarData.reduce((sum, day) => sum + day.totalCustomers, 0);
      // Each customer typically gets 1-2 services
      const services = totalCustomers * (1.3 + Math.random() * 0.4);
      setTotalServices(Math.floor(services));
    }, 500); // Wait for calendar data
  };

  const fetchRatingData = () => {
    setTimeout(() => {
      const roles = [
        { role_id: 1, role_name: 'Manager' },
        { role_id: 2, role_name: 'Stylist' },
        { role_id: 3, role_name: 'Masseur' },
        { role_id: 4, role_name: 'Beautician' },
        { role_id: 5, role_name: 'Nail Technician' },
        { role_id: 6, role_name: 'Spa Therapist' }
      ];

      // More realistic ratings - different roles have different rating tendencies
      const generateRatings = () => roles.map(role => {
        let baseRating;
        let reviewCount;

        // Different roles have different rating tendencies
        switch (role.role_id) {
          case 1: // Manager
            baseRating = 8.5 + Math.random() * 1.5;
            reviewCount = 5 + Math.floor(Math.random() * 10);
            break;
          case 2: // Stylist
            baseRating = 8.0 + Math.random() * 2.0;
            reviewCount = 30 + Math.floor(Math.random() * 20);
            break;
          case 3: // Masseur
            baseRating = 9.0 + Math.random() * 1.0;
            reviewCount = 25 + Math.floor(Math.random() * 15);
            break;
          case 4: // Beautician
            baseRating = 8.8 + Math.random() * 1.2;
            reviewCount = 20 + Math.floor(Math.random() * 15);
            break;
          case 5: // Nail Technician
            baseRating = 8.2 + Math.random() * 1.8;
            reviewCount = 15 + Math.floor(Math.random() * 10);
            break;
          default: // Spa Therapist
            baseRating = 8.7 + Math.random() * 1.3;
            reviewCount = 18 + Math.floor(Math.random() * 12);
        }

        // Cap at 10
        const rating = Math.min(baseRating, 10).toFixed(1);

        return {
          role_id: role.role_id,
          role_name: role.role_name,
          average_rating: rating,
          total_reviews: reviewCount
        };
      });

      // Generate slightly different data for current vs last month
      const currentMonthData = generateRatings();

      // Last month's data is slightly different (generally lower)
      const lastMonthData = currentMonthData.map(item => ({
        ...item,
        average_rating: (parseFloat(item.average_rating) - (0.2 + Math.random() * 0.3)).toFixed(1),
        total_reviews: Math.floor(item.total_reviews * 0.85)
      }));

      setRatingData(ratingPeriod === 0 ? currentMonthData : lastMonthData);
    }, 300);
  };

  const fetchChartData = () => {
    setTimeout(() => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      if (timeFrame === 'month') {
        // Monthly view
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Generate revenue data for each month
        const revenueData = months.map((month, index) => {
          const isPastMonth = index <= currentMonth;

          // Seasonal patterns
          let baseRevenue;
          if ([11, 0, 1].includes(index)) { // Winter months
            baseRevenue = 75000 + Math.random() * 15000;
          } else if ([2, 3, 4].includes(index)) { // Spring months
            baseRevenue = 90000 + Math.random() * 20000;
          } else if ([5, 6, 7].includes(index)) { // Summer months
            baseRevenue = 110000 + Math.random() * 25000;
          } else { // Fall months
            baseRevenue = 95000 + Math.random() * 18000;
          }

          const finalRevenue = isPastMonth
            ? Math.round(baseRevenue)
            : Math.round(baseRevenue * 0.85 + Math.random() * baseRevenue * 0.3);

          return {
            name: month,
            data: finalRevenue
          };
        });

        // Generate customer data with similar seasonal patterns
        const customerData = months.map((month, index) => {
          const isPastMonth = index <= currentMonth;

          // Seasonal patterns
          let baseCustomers;
          if ([11, 0, 1].includes(index)) { // Winter
            baseCustomers = 220 + Math.random() * 80;
          } else if ([2, 3, 4].includes(index)) { // Spring
            baseCustomers = 280 + Math.random() * 100;
          } else if ([5, 6, 7].includes(index)) { // Summer
            baseCustomers = 350 + Math.random() * 120;
          } else { // Fall
            baseCustomers = 300 + Math.random() * 90;
          }

          const finalCustomers = isPastMonth
            ? Math.round(baseCustomers)
            : Math.round(baseCustomers * 0.9 + Math.random() * baseCustomers * 0.2);

          return {
            name: month,
            data: finalCustomers
          };
        });

        setTotalMonthlyRevenue(revenueData.reduce((sum, item) => sum + item.data, 0));
        setTotalMonthlyCustomers(customerData.reduce((sum, item) => sum + item.data, 0));
        setRevenueChartData(revenueData);
        setCustomerChartData(customerData);
      } else {
        // Yearly view
        const years = [];
        for (let i = 4; i >= 0; i--) {
          years.push(currentYear - i);
        }
        years.sort((a, b) => a - b);

        // Generate revenue data with growth trend over years
        const revenueData = years.map((year, index) => {
          const baseRevenue = 800000 + (index * 250000) + (Math.random() * 100000);
          return {
            name: year.toString(),
            data: Math.round(baseRevenue)
          };
        });

        // Generate customer data with growth trend over years
        const customerData = years.map((year, index) => {
          const baseCustomers = 2000 + (index * 500) + (Math.random() * 400);
          return {
            name: year.toString(),
            data: Math.round(baseCustomers)
          };
        });

        // Calculate growth rates
        if (revenueData.length >= 2) {
          const currentYearRevenue = revenueData[revenueData.length - 1].data;
          const prevYearRevenue = revenueData[revenueData.length - 2].data;
          const revGrowthPercentage = ((currentYearRevenue - prevYearRevenue) / prevYearRevenue * 100).toFixed(1);
          setRevenueGrowth(`${revGrowthPercentage > 0 ? '+' : ''}${revGrowthPercentage}%`);
        }

        if (customerData.length >= 2) {
          const currentYearCustomers = customerData[customerData.length - 1].data;
          const prevYearCustomers = customerData[customerData.length - 2].data;
          const custGrowthPercentage = ((currentYearCustomers - prevYearCustomers) / prevYearCustomers * 100).toFixed(1);
          setCustomerGrowth(`${custGrowthPercentage > 0 ? '+' : ''}${custGrowthPercentage}%`);
        }

        setRevenueChartData(revenueData);
        setCustomerChartData(customerData);
      }
    }, 300);
  };

  const fetchTodayAppointments = () => {
    setTimeout(() => {
      const today = new Date();
      const appointmentStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

      // Generate 10-15 appointments for today
      const count = 10 + Math.floor(Math.random() * 6);

      const appointments = Array(count).fill().map((_, idx) => {
        const hour = 8 + Math.floor(Math.random() * 13); // 8 AM to 8 PM
        const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];

        const appointmentTime = new Date(today);
        appointmentTime.setHours(hour, minute, 0);

        const service = serviceData[Math.floor(Math.random() * serviceData.length)];
        const staff = staffList[Math.floor(Math.random() * staffList.length)];

        return {
          appointment_id: 1000 + idx,
          customer_name: `Customer ${1000 + idx}`,
          customer_phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          appointment_time: appointmentTime,
          service_id: service.service_id,
          service_name: service.name,
          service_price: service.price,
          service_duration: service.duration,
          staff_id: staff.user_id,
          staff_name: staff.full_name,
          status: appointmentStatuses[Math.floor(Math.random() * 4)],
          branch_id: branchData[Math.floor(Math.random() * branchData.length)].branch_id,
          branch_name: branchData[Math.floor(Math.random() * branchData.length)].name
        };
      });

      // Sort by time
      appointments.sort((a, b) => a.appointment_time - b.appointment_time);

      setTodayAppointments(appointments);
    }, 300);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'On Time':
        return <Chip size="small" label={status} color="success" icon={<CheckCircleOutlined />} />;
      case 'Late':
        return <Chip size="small" label={status} color="warning" icon={<ClockCircleOutlined />} />;
      case 'Working':
        return <Chip size="small" label={status} color="info" icon={<SyncOutlined />} />;
      default:
        return <Chip size="small" label={status} color="default" icon={<CloseCircleOutlined />} />;
    }
  };

  const getAppointmentStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Pending" color="warning" />;
      case 'confirmed':
        return <Chip size="small" label="Confirmed" color="primary" />;
      case 'completed':
        return <Chip size="small" label="Completed" color="success" />;
      case 'cancelled':
        return <Chip size="small" label="Cancelled" color="error" />;
      default:
        return <Chip size="small" label={status} color="default" />;
    }
  };

  const formatTime = (date) => {
    return format(date, 'h:mm a');
  };

  // Update RevenueChart component with loading state
  const RevenueChart = () => (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box display="flex" alignItems="center">
            <DollarOutlined style={{ marginRight: 8 }} />
            <Typography variant="h5">Revenue Trends</Typography>
          </Box>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={revenueTimeFrame === 'month' ? 'contained' : 'outlined'}
              onClick={() => setRevenueTimeFrame('month')}
            >
              Monthly
            </Button>
            <Button
              variant={revenueTimeFrame === 'year' ? 'contained' : 'outlined'}
              onClick={() => setRevenueTimeFrame('year')}
            >
              Yearly
            </Button>
          </ButtonGroup>
        </Box>
      }
    >
      <Box p={2}>
        <Typography variant="subtitle1" mb={1} color="textSecondary">
          {revenueTimeFrame === 'month'
            ? `Monthly revenue breakdown for ${new Date().getFullYear()}`
            : 'Revenue comparison for the last 5 years'}
        </Typography>

        <Typography variant="h4" mb={2}>
          {revenueTimeFrame === 'month'
            ? `$${(totalMonthlyRevenue/1000).toFixed(1)}K`
            : `${revenueGrowth} year-over-year growth`}
        </Typography>

        <Box className="chart-container" sx={{ position: 'relative' }}>
          {revenueLoading ? (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 10,
                borderRadius: '8px'
              }}
            >
              <LinearProgress sx={{ width: '70%' }} />
            </Box>
          ) : null}
          <ReportAreaChart
            timeFrame={revenueTimeFrame}
            chartData={revenueChartData}
          />
        </Box>
      </Box>
    </MainCard>
  );

  // Update CustomerChart component with loading state
  const CustomerChart = () => (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box display="flex" alignItems="center">
            <TeamOutlined style={{ marginRight: 8 }} />
            <Typography variant="h5">Customer Trends</Typography>
          </Box>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={customerTimeFrame === 'month' ? 'contained' : 'outlined'}
              onClick={() => setCustomerTimeFrame('month')}
            >
              Monthly
            </Button>
            <Button
              variant={customerTimeFrame === 'year' ? 'contained' : 'outlined'}
              onClick={() => setCustomerTimeFrame('year')}
            >
              Yearly
            </Button>
          </ButtonGroup>
        </Box>
      }
    >
      <Box p={2}>
        <Typography variant="subtitle1" mb={1} color="textSecondary">
          {customerTimeFrame === 'month'
            ? `Monthly customer count for ${new Date().getFullYear()}`
            : 'Customer growth over the last 5 years'}
        </Typography>

        <Typography variant="h4" mb={2}>
          {customerTimeFrame === 'month'
            ? `${totalMonthlyCustomers.toLocaleString()} customers`
            : `${customerGrowth} year-over-year growth`}
        </Typography>

        <Box className="chart-container" sx={{ position: 'relative' }}>
          {customerLoading ? (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 10,
                borderRadius: '8px'
              }}
            >
              <LinearProgress sx={{ width: '70%' }} />
            </Box>
          ) : null}
          <MonthlyBarChart
            timeFrame={customerTimeFrame}
            chartData={customerChartData}
          />
        </Box>
      </Box>
    </MainCard>
  );

  // Enhanced Calendar component with modal instead of tooltips
  const CustomerCalendar = () => {
    const prevMonth = () => {
      const newDate = new Date(selectedMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setSelectedMonth(newDate);
    };

    const nextMonth = () => {
      const newDate = new Date(selectedMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      const today = new Date();
      // Don't allow navigating past current month
      if (newDate <= today ||
        (newDate.getMonth() === today.getMonth() &&
          newDate.getFullYear() === today.getFullYear())) {
        setSelectedMonth(newDate);
      }
    };

    const currentMonth = () => {
      setSelectedMonth(new Date());
    };

    const isCurrentMonth = () => {
      const today = new Date();
      return selectedMonth.getMonth() === today.getMonth() &&
        selectedMonth.getFullYear() === today.getFullYear();
    };

    const handleDayClick = (day) => {
      if (day.totalCustomers > 0) {
        setSelectedDay(day);
        setDayModalOpen(true);
      }
    };

    const handleCloseModal = () => {
      setDayModalOpen(false);
    };

    return (
      <MainCard
        title={
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box display="flex" alignItems="center">
              <CalendarOutlined style={{ marginRight: 8 }} />
              <Typography variant="h5">Customer Calendar</Typography>
            </Box>
            <Box>
              <IconButton size="small" onClick={prevMonth}>
                <LeftOutlined />
              </IconButton>
              <Button size="small" onClick={currentMonth} disabled={isCurrentMonth()}>
                Current
              </Button>
              <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth()}>
                <RightOutlined />
              </IconButton>
            </Box>
          </Box>
        }
      >
        <Box className="calendar-wrapper">
          <Typography variant="h6" className="calendar-month">
            {format(selectedMonth, 'MMMM yyyy')}
          </Typography>

          <Box className="calendar-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <Box key={idx} className="weekday">{day}</Box>
            ))}
          </Box>

          <Box className="calendar-grid">
            {/* Empty cells for days before the 1st of month */}
            {Array(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay())
              .fill().map((_, idx) => (
                <Box key={`empty-start-${idx}`} className="calendar-day empty"></Box>
              ))}

            {/* Actual days of the month */}
            {calendarData.map((day, idx) => {
              const displayDate = new Date(day.date);
              return (
                <Box
                  key={idx}
                  className={`calendar-day ${day.isWeekend ? 'weekend' : ''} ${
                    isToday(displayDate) ? 'today' : ''
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <Typography className="day-number">{day.dayOfMonth}</Typography>

                  {day.totalCustomers > 0 && (
                    <Chip
                      size="small"
                      label={`${day.totalCustomers}`}
                      color="primary"
                      className="customer-count-badge"
                    />
                  )}
                </Box>
              );
            })}

            {/* Empty cells for days after the end of month */}
            {Array(
              6 - new Date(
                selectedMonth.getFullYear(),
                selectedMonth.getMonth() + 1,
                0
              ).getDay()
            )
              .fill()
              .map((_, idx) => (
                <Box key={`empty-end-${idx}`} className="calendar-day empty"></Box>
              ))}
          </Box>
        </Box>

        {/* Day detail modal */}
        <Dialog
          open={dayModalOpen}
          onClose={handleCloseModal}
          maxWidth="xs"
          fullWidth
        >
          {selectedDay && (
            <>
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5">
                    {format(new Date(selectedDay.date), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                  {isToday(new Date(selectedDay.date)) && (
                    <Chip size="small" label="Today" color="primary" />
                  )}
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box mb={2}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Customer Statistics
                  </Typography>
                  <Typography variant="body1">
                    Total customers: <strong>{selectedDay.totalCustomers}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedDay.isWeekend ? 'Weekend day (typically busier)' : 'Weekday'}
                  </Typography>
                </Box>

                <Divider />

                <Box mt={2}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Distribution by Shift
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Morning Shift"
                        secondary={`${selectedDay.shifts.Morning} customers (${Math.round(selectedDay.shifts.Morning/selectedDay.totalCustomers*100)}%)`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={selectedDay.shifts.Morning/selectedDay.totalCustomers*100}
                        sx={{ width: '100px', height: 8, borderRadius: 2 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Afternoon Shift"
                        secondary={`${selectedDay.shifts.Afternoon} customers (${Math.round(selectedDay.shifts.Afternoon/selectedDay.totalCustomers*100)}%)`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={selectedDay.shifts.Afternoon/selectedDay.totalCustomers*100}
                        sx={{ width: '100px', height: 8, borderRadius: 2 }}
                        color="secondary"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Evening Shift"
                        secondary={`${selectedDay.shifts.Evening} customers (${Math.round(selectedDay.shifts.Evening/selectedDay.totalCustomers*100)}%)`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={selectedDay.shifts.Evening/selectedDay.totalCustomers*100}
                        sx={{ width: '100px', height: 8, borderRadius: 2 }}
                        color="success"
                      />
                    </ListItem>
                  </List>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseModal}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </MainCard>
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Greeting Section */}
      <Grid item xs={12}>
        <Box className="greeting-card">
          <Box className="greeting-content">
            <Typography variant="h3" className="greeting-title">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {username}!
            </Typography>
            <Typography variant="body1" className="greeting-subtitle">
              Welcome to your Beauty Spa management dashboard
            </Typography>
            <Box className="greeting-info">
              <Chip
                icon={<ClockCircleOutlined />}
                label={`${format(currentTime, 'EEEE, MMMM d')} | ${format(currentTime, 'h:mm a')}`}
                variant="outlined"
                color="primary"
              />
              <Chip
                icon={<ScheduleOutlined />}
                label={`Current Shift: ${currentShift}`}
                variant="outlined"
              />
            </Box>
          </Box>
          <Box className="greeting-image" />
        </Box>
      </Grid>

      {/* Quick Stats Row */}
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Waiting Customers"
          count={waitingCustomers}
          percentage={12.3}
          extra={`${servedCustomers} served today`}
          color="warning"
          icon={<UserOutlined />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Total Services"
          count={totalServices}
          percentage={8.5}
          extra="This month"
          icon={<ShopOutlined />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Average Rating"
          count="9.2"
          percentage={3.2}
          extra="Based on customer feedback"
          color="success"
          icon={<StarOutlined />}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce
          title="Today's Revenue"
          count="$1,280"
          percentage={18.6}
          extra="Compared to yesterday"
          color="primary"
          icon={<DollarOutlined />}
        />
      </Grid>

      {/* Main Content Area */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={3}>
          {/* Staff Schedule */}
          <Grid item xs={12}>
            <MainCard
              title={
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Box display="flex" alignItems="center">
                    <ScheduleOutlined style={{ marginRight: 8 }} />
                    <Typography variant="h5">Staff Schedule</Typography>
                  </Box>
                  <Chip
                    icon={<ClockCircleOutlined />}
                    label={`Current Shift: ${currentShift}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              }
            >
              <TableContainer className="schedule-table-container">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Staff</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Check In</TableCell>
                      <TableCell>Branch</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduleData.map((staff) => (
                      <TableRow key={staff.user_id} className="staff-row">
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar src={staff.image_url} sx={{ width: 28, height: 28, mr: 1 }} />
                            {staff.full_name}
                          </Box>
                        </TableCell>
                        <TableCell>{staff.role_name}</TableCell>
                        <TableCell>{staff.check_in_time}</TableCell>
                        <TableCell>{staff.branch}</TableCell>
                        <TableCell>{getStatusChip(staff.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>

          {/* Revenue Chart */}
          <Grid item xs={12}>
            <RevenueChart />
          </Grid>

          {/* Customer Chart */}
          <Grid item xs={12}>
            <CustomerChart />
          </Grid>
        </Grid>
      </Grid>

      {/* Sidebar Content */}
      <Grid item xs={12} md={4}>
        <Grid container spacing={3}>
          {/* Customer Calendar */}
          <Grid item xs={12}>
            <CustomerCalendar />
          </Grid>

          {/* Staff Rating */}
          <Grid item xs={12}>
            <MainCard
              title={
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Box display="flex" alignItems="center">
                    <StarOutlined style={{ marginRight: 8 }} />
                    <Typography variant="h5">Staff Rating</Typography>
                  </Box>
                  <ButtonGroup variant="outlined" size="small">
                    <Button
                      variant={ratingPeriod === 0 ? 'contained' : 'outlined'}
                      onClick={() => setRatingPeriod(0)}
                    >
                      This Month
                    </Button>
                    <Button
                      variant={ratingPeriod === 1 ? 'contained' : 'outlined'}
                      onClick={() => setRatingPeriod(1)}
                    >
                      Last Month
                    </Button>
                  </ButtonGroup>
                </Box>
              }
            >
              <TableContainer className="rating-table">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Role</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell align="right">Reviews</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ratingData.map((item) => (
                      <TableRow key={item.role_id} className="rating-row">
                        <TableCell>{item.role_name}</TableCell>
                        <TableCell>
                          <Box className="rating-display">
                            <Typography fontWeight="600">{item.average_rating}</Typography>
                            <Box className="rating-bar-container">
                              <Box
                                className="rating-bar"
                                sx={{ width: `${(parseFloat(item.average_rating) / 10) * 100}%` }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{item.total_reviews}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </MainCard>
          </Grid>

          {/* Today's Appointments */}
          <Grid item xs={12}>
            <MainCard
              title={
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Box display="flex" alignItems="center">
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    <Typography variant="h5">Today's Appointments</Typography>
                  </Box>
                  <Chip
                    icon={<UserOutlined />}
                    label={`${todayAppointments.length} appointments`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              }
            >
              <List className="appointment-list">
                {todayAppointments.map((appointment) => (
                  <React.Fragment key={appointment.appointment_id}>
                    <ListItem className="appointment-item">
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                          {formatTime(appointment.appointment_time)}
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 2, flexGrow: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {appointment.customer_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {appointment.service_name} • {appointment.staff_name}
                        </Typography>
                      </Box>
                      <Box>
                        {getAppointmentStatusChip(appointment.status)}
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
                <Box className="more-appointments">
                  <Button
                    size="small"
                    endIcon={<EyeOutlined />}
                  >
                    View All Appointments
                  </Button>
                </Box>
              </List>
            </MainCard>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DashboardDefault;