// material-ui
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| SAMPLE PAGE ||============================== //

export default function SamplePage() {
  return (
    <MainCard title="Trang mẫu">
      <Typography variant="body2">
        Đây là nội dung mẫu của trang. Bạn có thể thay thế nội dung này bằng bất kỳ văn bản hoặc thành phần nào khác phù hợp với ứng dụng
        của mình. Trang này được sử dụng để minh họa cách cấu trúc và thiết kế của hệ thống làm việc. Bạn có thể tùy chỉnh giao diện và nội
        dung theo nhu cầu cụ thể của dự án.
      </Typography>
    </MainCard>
  );
}
