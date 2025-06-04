import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third-party
import ReactApexChart from 'react-apexcharts';

// ==============================|| REPORT AREA CHART ||============================== //

const ReportAreaChart = ({ timeFrame, chartData }) => {
  const theme = useTheme();
  const { primary, secondary } = theme.palette.text;
  const line = theme.palette.divider;

  const [options, setOptions] = useState({
    chart: {
      height: 340,
      type: 'area',
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    grid: {
      strokeDashArray: 0
    },
    xaxis: {
      categories: [],
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      tickAmount: 5,
      labels: {
        formatter: (value) => `$${value}`
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `$${value.toLocaleString()}`
      }
    }
  });

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const categories = chartData.map((item) => item.name);

      setOptions((prevState) => ({
        ...prevState,
        xaxis: {
          ...prevState.xaxis,
          categories: categories
        }
      }));
    }
  }, [chartData, timeFrame]);

  const [series, setSeries] = useState([]);

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const data = chartData.map((item) => item.data);
      setSeries([
        {
          name: 'Revenue',
          data: data
        }
      ]);
    }
  }, [chartData]);

  return <ReactApexChart options={options} series={series} type="area" height={340} />;
};

ReportAreaChart.propTypes = {
  timeFrame: PropTypes.string,
  chartData: PropTypes.array
};

export default ReportAreaChart;