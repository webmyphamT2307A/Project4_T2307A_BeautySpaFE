import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import MainCard from 'components/MainCard';
import { DeleteOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:8080/api/v1/feedbacks';

const FeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchFeedbacks = () => {
    setLoading(true);
    // API hỗ trợ phân trang, gửi page và size
    const url = `${API_BASE_URL}?page=${page}&size=${rowsPerPage}`;

    fetch(url)
      .then((res) => res.json())
      .then((response) => {
        if (response.status === 'SUCCESS' && response.data) {
          setFeedbacks(response.data.content || []);
          setTotalElements(response.data.totalElements || 0);
        } else {
          setFeedbacks([]);
          toast.error('Failed to load feedbacks.');
        }
      })
      .catch(() => {
        setFeedbacks([]);
        toast.error('Error connecting to the server.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDelete = (feedbackId) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: 'Bạn sẽ không thể hoàn tác hành động này!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        // Giả sử API để xóa (soft-delete) có dạng: PUT /api/v1/feedbacks/delete/{id}
        // Backend cần cung cấp endpoint này cho admin
        fetch(`${API_BASE_URL}/delete/${feedbackId}`, {
          method: 'PUT'
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.status === 'SUCCESS') {
              Swal.fire('Đã xóa!', 'Feedback đã được xóa.', 'success');
              fetchFeedbacks(); // Tải lại danh sách sau khi xóa
            } else {
              toast.error(data.message || 'Failed to delete feedback.');
            }
          })
          .catch(() => {
            toast.error('Error connecting to the server for deletion.');
          });
      }
    });
  };

  // Lọc dữ liệu trên client-side (vì backend không hỗ trợ tìm kiếm)
  const filteredFeedbacks = feedbacks.filter(
    (fb) =>
      (fb.customerName && fb.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (fb.subject && fb.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (fb.message && fb.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MainCard title="Quản Lý Phản Hồi Khách Hàng">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Tìm theo tên, chủ đề, nội dung..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseOutlined style={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{ maxWidth: '400px' }}
        />
      </Box>

      <Paper sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650, maxHeight: 800 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ pl: 3 }}>#</TableCell>
                <TableCell>Khách Hàng</TableCell>
                <TableCell>Chủ Đề</TableCell>
                <TableCell>Nội Dung</TableCell>
                <TableCell>Ngày Gửi</TableCell>
                <TableCell>Trạng Thái</TableCell>
                <TableCell align="center" sx={{ pr: 3 }}>
                  Thao Tác
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                    <Typography>Đang tải dữ liệu...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredFeedbacks.length > 0 ? (
                filteredFeedbacks.map((fb, index) => (
                  <TableRow key={fb.id} hover>
                    <TableCell sx={{ pl: 3 }}>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {fb.customerName || 'Khách vãng lai'}
                      </Typography>
                    </TableCell>
                    <TableCell>{fb.subject || 'Không có chủ đề'}</TableCell>
                    <TableCell>
                      <Tooltip title={fb.message}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: '300px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {fb.message}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{new Date(fb.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell>
                      <Chip label={fb.isActive ? 'Hoạt Động' : 'Đã Ẩn'} color={fb.isActive ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center" sx={{ pr: 3 }}>
                      <Tooltip title="Xóa (Ẩn) Feedback">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(fb.id)}
                            disabled={!fb.isActive} // Vô hiệu hóa nút nếu đã ẩn
                          >
                            <DeleteOutlined />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="subtitle1">Không tìm thấy phản hồi nào.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </MainCard>
  );
};

export default FeedbackManager;