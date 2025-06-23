// material-ui
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| SAMPLE PAGE ||============================== //

export default function SamplePage() {
  return (
    <MainCard title="Trang Mẫu">
      <Typography variant="body2">
        Đây là nội dung mẫu của trang. Bạn có thể chỉnh sửa nội dung này để phù hợp với yêu cầu của dự án. 
        Trang này được tạo ra để minh họa cách sử dụng các component cơ bản trong ứng dụng spa beauty.
        Bạn có thể thêm các chức năng mới hoặc tùy chỉnh giao diện theo ý muốn.
      </Typography>
    </MainCard>
  );
}
