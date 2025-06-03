import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third-party
import ReactApexChart from 'react-apexcharts';

// chart options
const barChartOptions = {
  chart: {
    type: 'bar',
    height: 340,
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      columnWidth: '60%',
      borderRadius: 4
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    show: true,
    width: 8,
    colors: ['transparent']
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
    labels: {
      formatter: (val) => val.toFixed(0)
    }
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter: (val) => `${val} customers`
    }
  },
  legend: {
    show: true,
    fontFamily: '`Public Sans`, sans-serif',
    offsetX: 10,
    offsetY: 10,
    labels: {
      useSeriesColors: false
    },
    markers: {
      width: 16,
      height: 16,
      radius: 5
    },
    itemMargin: {
      horizontal: 15,
      vertical: 8
    }
  },
  responsive: [
    {
      breakpoint: 600,
      options: {
        plotOptions: {
          bar: {
            columnWidth: '90%'
          }
        }
      }
    }
  ]
};

// ==============================|| MONTHLY BAR CHART ||============================== //

const MonthlyBarChart = ({ timeFrame, chartData }) => {
  const theme = useTheme();

  const [series, setSeries] = useState([]);
  const [options, setOptions] = useState(barChartOptions);

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const data = chartData.map((item) => item.data);
      const categories = chartData.map((item) => item.name);

      setSeries([
        {
          name: 'Customers',
          data: data
        }
      ]);

      setOptions((prevState) => ({
        ...prevState,
        xaxis: {
          ...prevState.xaxis,
          categories: categories
        },
        colors: [theme.palette.primary.main]
      }));
    }
  }, [chartData, theme, timeFrame]);

  return <ReactApexChart options={options} series={series} type="bar" height={340} />;
};

MonthlyBarChart.propTypes = {
  timeFrame: PropTypes.string,
  chartData: PropTypes.array
};

export default MonthlyBarChart;