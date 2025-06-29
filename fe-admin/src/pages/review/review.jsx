import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, FormControl, InputLabel, Select, MenuItem, Box,
    Modal, Typography, TextField, Button, Paper, TablePagination, Grid, Chip
} from '@mui/material';
import { DeleteOutlined, ReadFilled } from '@ant-design/icons'; // <<< THAY ĐỔI: Dùng ReadFilled cho trực quan
import { useNavigate } from 'react-router-dom';
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Style cho Modal
const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

const ReviewList = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [staffFilter, setStaffFilter] = useState('all');
    const [staffList, setStaffList] = useState([]);
    const [page, setPage] = useState(0);
    const [totalElement, setTotalElement] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // State để quản lý modal phản hồi
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    // Hàm xử lý click vào rating để chuyển đến trang đặt lịch
    const handleRatingClick = (review) => {
        console.log('🔍 Review clicked:', review);
        
        // Kiểm tra xem review có thông tin service không
        if (review.type === 'service' && review.relatedId) {
            // Chuyển đến trang appointment với filter theo service
            navigate('/spa/appointments', {
                state: {
                    serviceId: review.relatedId,
                    serviceName: review.serviceName || `Service #${review.relatedId}`,
                    title: `Đặt Lịch Dịch Vụ "${review.serviceName || `#${review.relatedId}`}" (từ đánh giá ${review.rating}⭐)`,
                    fromReview: true,
                    reviewId: review.id,
                    rating: review.rating
                }
            });
            toast.info(`Chuyển đến trang đặt lịch cho dịch vụ: ${review.serviceName || `#${review.relatedId}`}`);
        } else if (review.type === 'staff' && review.relatedId) {
            // Nếu là review cho nhân viên, chuyển đến trang appointment với filter theo staff
            navigate('/spa/appointments', {
                state: {
                    staffId: review.relatedId,
                    staffName: review.userName || `Staff #${review.relatedId}`,
                    title: `Đặt Lịch với Nhân Viên "${review.userName || `#${review.relatedId}`}" (từ đánh giá ${review.rating}⭐)`,
                    fromReview: true,
                    reviewId: review.id,
                    rating: review.rating
                }
            });
            toast.info(`Chuyển đến trang đặt lịch với nhân viên: ${review.userName || `#${review.relatedId}`}`);
        } else {
            // Nếu không có thông tin đầy đủ, chuyển đến trang appointment chung
            navigate('/spa/appointments', {
                state: {
                    title: `Đặt Lịch từ Đánh Giá #${review.id} (${review.rating}⭐)`,
                    fromReview: true,
                    reviewId: review.id,
                    rating: review.rating
                }
            });
            toast.info('Chuyển đến trang đặt lịch hẹn');
        }
    };

    // Lấy tất cả review cho admin
    const fetchReviews = async () => {
        setLoading(true);
        console.log('🚀 Bắt đầu quá trình fetch reviews...');
        try {
            const token = localStorage.getItem('token');
            const ratingParam = ratingFilter !== 'all' ? `&rating=${ratingFilter}` : '';
            const res = await fetch(`${API_BASE_URL}/reviews/reviews?page=${page}&size=${rowsPerPage}${ratingParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                // Ghi lại lỗi nếu response không thành công (vd: 401, 403, 500)
                console.error(`Lỗi HTTP! Status: ${res.status}`, await res.text());
                throw new Error(`API call failed with status ${res.status}`);
            }

            const data = await res.json();
            console.log('✅ Dữ liệu thô nhận được từ /reviews/findAll:', data);

            if (Array.isArray(data.content)) {
                const reviewsData = data.content;
                console.log(`🔍 Tìm thấy ${reviewsData.length} review(s). Bắt đầu lấy chi tiết...`);
                setTotalElement(data.totalElements || 0);
                const reviewsWithDetails = await Promise.all(
                    reviewsData.map(async (review) => {
                        // Kiểm tra review và review.id trước khi fetch
                        if (!review || typeof review.id === 'undefined') {
                            console.warn('⚠️ Bỏ qua review không hợp lệ (thiếu id):', review);
                            return null; // Trả về null để lọc ra sau
                        }
                        try {
                            const detailRes = await fetch(`${API_BASE_URL}/reviews/${review.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const detailData = await detailRes.json();
                            if (detailData.status === 'SUCCESS' && detailData.data) {
                                // Gộp review gốc với chi tiết (đặc biệt là replies)
                                return { ...review, replies: detailData.data.replies || [] };
                            }
                            // Nếu lấy chi tiết thất bại, vẫn giữ lại review gốc
                            console.warn(`Không thể lấy chi tiết cho review #${review.id}.`, detailData.message);
                            return { ...review, replies: [] };
                        } catch (detailError) {
                            console.error(`Lỗi khi fetch chi tiết review #${review.id}:`, detailError);
                            return { ...review, replies: [] }; // Giữ lại review gốc khi có lỗi
                        }
                    })
                );

                // Lọc ra các review không hợp lệ (bị null)
                const validReviews = reviewsWithDetails.filter(r => r !== null);
                console.log('🎉 Hoàn tất lấy chi tiết. Tổng số review hợp lệ:', validReviews.length);
                setReviews(validReviews);

            } else {
                const errorMessage = data.message || 'Dữ liệu trả về không hợp lệ.';
                toast.error(errorMessage);
                console.error('Lỗi logic hoặc dữ liệu API:', errorMessage, data);
            }
        } catch (error) {
            console.error('❌ Đã xảy ra lỗi nghiêm trọng trong fetchReviews:', error);
            toast.error('Không thể tải danh sách đánh giá. Vui lòng kiểm tra console.');
        }
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, [page, rowsPerPage]);

    // Lấy danh sách nhân viên để lọc
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const token = localStorage.getItem('token');
                // API này đã được sử dụng ở các trang khác để lấy nhân viên
                const res = await fetch(`${API_BASE_URL}/admin/accounts/find-all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const response = await res.json();
                if (response.status === 'SUCCESS' && Array.isArray(response.data)) {
                    const staffUsers = response.data.filter(user => user.role?.name?.toUpperCase() === 'STAFF');
                    setStaffList(staffUsers);
                } else {
                    console.error("Không thể tải danh sách nhân viên:", response.message);
                }
            } catch (error) {
                console.error("Lỗi kết nối khi tải danh sách nhân viên:", error);
            }
        };
        fetchStaff();
    }, []);

    // Các hàm xử lý modal
    const handleOpenReplyModal = (review) => {
        setSelectedReview(review);
        setReplyModalOpen(true);
    };

    const handleCloseReplyModal = () => {
        setReplyModalOpen(false);
        setSelectedReview(null);
        setReplyContent('');
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) {
            toast.warn('Please enter a reply.');
            return;
        }
        setIsSubmittingReply(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/reviews/${selectedReview.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ comment: replyContent })
            });

            const data = await res.json();
            if (res.ok && data.status === 'SUCCESS') {
                toast.success('Reply submitted successfully!');
                handleCloseReplyModal();
                fetchReviews(); // Tải lại danh sách để cập nhật
            } else {
                toast.error(data.message || 'Failed to submit reply');
            }
        } catch (error) {
            toast.error('An error occurred while submitting the reply.');
        } finally {
            setIsSubmittingReply(false);
        }
    };


    // Xóa review (soft-delete)
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: 'Thao tác này sẽ thay đổi trạng thái đánh giá!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
            reverseButtons: true
        });

        if (!result.isConfirmed) {
            toast.info('Đã hủy thay đổi trạng thái.');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                toast.success('Đã thay đổi trạng thái đánh giá!');
                fetchReviews();
            } else {
                toast.error(data.message || 'Thất bại');
            }
        } catch {
            toast.error('Đã xảy ra lỗi khi xóa');
        }
        setLoading(false);
    };

    const filteredReviews = reviews.filter(r => {
        const statusMatch = statusFilter === 'all' ||
            (statusFilter === 'active' && (r.active === true || r.active === 1)) ||
            (statusFilter === 'inactive' && (r.active === false || r.active === 0));

        const ratingMatch = ratingFilter === 'all' || r.rating === ratingFilter;

        const typeMatch = typeFilter === 'all' || r.type === typeFilter;

        // Lọc theo nhân viên chỉ áp dụng khi loại là 'staff'
        const staffMatch = typeFilter !== 'staff' || staffFilter === 'all' || String(r.relatedId) === String(staffFilter);

        return statusMatch && ratingMatch && typeMatch && staffMatch;
    });


    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    useEffect(() => {
        fetchReviews();
    }, [page, rowsPerPage, ratingFilter]);


    return (
        <MainCard title="Tất Cả Đánh Giá">
            <Box mb={2} display="flex" justifyContent="flex-start">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Đánh giá</InputLabel>
                    <Select
                      value={ratingFilter}
                      label="Rating"
                      onChange={e => setRatingFilter(e.target.value)}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value={5}>5 ⭐</MenuItem>
                        <MenuItem value={4}>4 ⭐</MenuItem>
                        <MenuItem value={3}>3 ⭐</MenuItem>
                        <MenuItem value={2}>2 ⭐</MenuItem>
                        <MenuItem value={1}>1 ⭐</MenuItem>
                    </Select>
                </FormControl>

            </Box>
            <TableContainer sx={{ maxHeight: 800 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Tác Giả</TableCell>
                            <TableCell>Loại</TableCell>
                            <TableCell>Bình Luận / Phản Hồi</TableCell>
                            <TableCell>Đánh Giá</TableCell>
                            <TableCell>Ngày Tạo</TableCell>
                            <TableCell>Trạng Thái</TableCell>
                            <TableCell align="center">Thao Tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading &&
                          <TableCell colSpan={8}><Box sx={{ display: 'flex', justifyContent: 'center', my: 2, top: "calc(50% - 20px)", left: "calc(50% - 20px)", zIndex:'100000' }}><CircularProgress /></Box></TableCell>}

                        {!loading && reviews.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.id}</TableCell>
                                <TableCell>{r.authorName || 'N/A'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={r.type === 'service' ? 'Dịch Vụ' : 'Nhân Viên'}
                                        color={r.type === 'service' ? 'primary' : 'secondary'}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell sx={{ minWidth: 250 }}>
                                    {/* // <<< THAY ĐỔI: Hiển thị comment và reply tại đây */}
                                    <Box>
                                        <Typography variant="body2">{r.comment}</Typography>
                                        {r.replies && r.replies.length > 0 && (
                                            <Paper variant="outlined" sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderLeft: '3px solid #1890ff' }}>
                                                <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', color: '#1890ff' }}>
                                                    Phản hồi bởi: {r.replies[0].authorName}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    "{r.replies[0].comment}"
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        cursor: 'pointer', 
                                        color: 'primary.main',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                            color: 'white',
                                            borderRadius: '4px',
                                            transform: 'scale(1.05)',
                                            transition: 'all 0.2s'
                                        },
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        padding: '8px'
                                    }}
                                    onClick={() => handleRatingClick(r)}
                                    title={`Click để đặt lịch ${r.type === 'service' ? 'dịch vụ' : 'nhân viên'} này`}
                                >
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        backgroundColor: 'primary.lighter',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                            color: 'white'
                                        }
                                    }}>
                                        <span style={{ fontSize: '16px' }}>{r.rating}</span>
                                        <span style={{ color: '#FFD700', marginLeft: '4px' }}>⭐</span>
                                    </Box>
                                    {r.type === 'service' && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {r.serviceName || `Dịch vụ #${r.relatedId}`}
                                        </Typography>
                                    )}
                                    {r.type === 'staff' && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {r.userName || `Nhân viên #${r.relatedId}`}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>{r.createdAt?.slice(0, 10)}</TableCell>
                                <TableCell>
                                    {r.active === false || r.active === 0 ? (
                                        <span style={{ color: 'red' }}>Không Hoạt Động</span>
                                    ) : (
                                        <span style={{ color: 'green' }}>Hoạt Động</span>
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    {/* // <<< THAY ĐỔI: Thêm nút Reply */}
                                    <Tooltip title="Phản Hồi">
                                        <span> {/* Bọc trong span để tooltip hoạt động khi button bị disabled */}
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenReplyModal(r)}
                                                disabled={r.replies && r.replies.length > 0} // Vô hiệu hóa nút nếu đã có reply
                                            >
                                                <ReadFilled />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Thay Đổi Trạng Thái">
                                        <IconButton color="error" onClick={() => handleDelete(r.id)}>
                                            <DeleteOutlined />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {reviews.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">Không tìm thấy đánh giá nào.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalElement}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* Modal để nhập phản hồi */}
            <Modal
                open={replyModalOpen}
                onClose={handleCloseReplyModal}
                aria-labelledby="reply-modal-title"
            >
                <Box sx={modalStyle}>
                    <Typography id="reply-modal-title" variant="h6" component="h2">
                        Phản Hồi Đánh Giá Của {selectedReview?.authorName}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        margin="normal"
                        label="Phản Hồi Của Bạn"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseReplyModal} sx={{ mr: 1 }}>Hủy</Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmitReply}
                            disabled={isSubmittingReply}
                        >
                            {isSubmittingReply ? <CircularProgress size={24} /> : 'Gửi Phản Hồi'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </MainCard>
    );
};

export default ReviewList;