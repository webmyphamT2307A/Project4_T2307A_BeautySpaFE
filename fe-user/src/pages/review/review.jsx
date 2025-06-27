import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, CircularProgress, FormControl, InputLabel, Select, MenuItem, Box,
    Modal, Typography, TextField, Button, Paper, TablePagination, Rating
} from '@mui/material';
import { DeleteOutlined, ReadFilled } from '@ant-design/icons'; 
import MainCard from 'components/MainCard';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAppointmentFilter } from 'contexts/AppointmentFilterContext';

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
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // State để quản lý modal phản hồi
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const navigate = useNavigate();
    const { setFilter } = useAppointmentFilter();

    const handleRatingClick = (review) => {
        console.log("Data của đánh giá vừa nhấn:", review);

        if (!review.relatedId || !review.type) {
            toast.info("Không thể đặt lịch từ đánh giá này (Thiếu ID hoặc Loại).");
            console.error("Lỗi: Dữ liệu review bị thiếu 'relatedId' hoặc 'type'.", { 
                relatedId: review.relatedId, 
                type: review.type 
            });
            return;
        }

        const filterPayload = {};
        let successMessage = '';
        const reviewType = review.type.toUpperCase();

        if (reviewType === 'SERVICE') {
            filterPayload.serviceId = review.relatedId;
            successMessage = 'Đã áp dụng bộ lọc theo dịch vụ. Chuyển đến trang đặt lịch...';
        } else if (reviewType === 'USER') {
            filterPayload.staffId = review.relatedId;
            successMessage = 'Đã áp dụng bộ lọc theo nhân viên. Chuyển đến trang đặt lịch...';
        }

        if (Object.keys(filterPayload).length > 0) {
            console.log("Đã tạo bộ lọc:", filterPayload);
            setFilter(filterPayload);
            toast.success(successMessage);
            console.log("Chuẩn bị chuyển hướng đến '/spa/appointments'");
            navigate('/spa/appointments');
        } else {
            console.warn("Không tạo được bộ lọc. Loại review có thể không hợp lệ:", review.type);
        }
    };

    // Lấy tất cả review cho admin
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/reviews/findAll`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                const reviewsData = Array.isArray(data.data) ? data.data : [];
                // Fetch detailed info for each review to get replies
                const reviewsWithDetails = await Promise.all(
                    reviewsData.map(async (review) => {
                        try {
                            const detailRes = await fetch(`${API_BASE_URL}/reviews/${review.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const detailData = await detailRes.json();
                            if (detailData.status === 'SUCCESS' && detailData.data.replies) {
                                return { ...review, replies: detailData.data.replies };
                            }
                            return { ...review, replies: [] };
                        } catch {
                            return { ...review, replies: [] };
                        }
                    })
                );
                setReviews(reviewsWithDetails);
            } else toast.error(data.message || 'Failed to load reviews');
        } catch {
            toast.error('Error loading reviews');
        }
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, []);

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
        if (!window.confirm('Bạn có chắc chắn muốn thay đổi trạng thái của đánh giá này?')) return;
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
                toast.success('Trạng thái đánh giá đã được thay đổi!');
                fetchReviews();
            } else toast.error(data.message || 'Thất bại');
        } catch {
            toast.error('Lỗi');
        }
        setLoading(false);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredReviews = reviews.filter(r => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return r.active === true || r.active === 1;
        if (statusFilter === 'inactive') return r.active === false || r.active === 0;
        return true;
    });

    const paginatedReviews = filteredReviews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <MainCard title="Tất cả đánh giá">
            <Box mb={2} display="flex" justifyContent="flex-end">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Trạng thái"
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="active">Hoạt động</MenuItem>
                        <MenuItem value="inactive">Không hoạt động</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Tác giả</TableCell>
                            <TableCell>Loại</TableCell>
                            <TableCell>Bình luận / Phản hồi</TableCell>
                            <TableCell>Đánh giá</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Ngày tạo</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedReviews.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.id}</TableCell>
                                <TableCell>{r.authorName || 'N/A'}</TableCell>
                                <TableCell>{r.type}</TableCell>
                                <TableCell sx={{ minWidth: 250 }}>
                                    <Box>
                                        <Typography variant="body2">{r.comment}</Typography>
                                        {r.replies && r.replies.length > 0 && (
                                            <Paper variant="outlined" sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderLeft: '3px solid #1890ff' }}>
                                                <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', color: '#1890ff' }}>
                                                    Trả lời bởi: {r.replies[0].authorName}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    "{r.replies[0].comment}"
                                                </Typography>
                                            </Paper>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="Nhấn để đặt lịch với lựa chọn này">
                                        <Typography
                                            onClick={() => handleRatingClick(r)}
                                            sx={{
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                color: 'warning.main', // Màu vàng cho giống sao
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                '&:hover': {
                                                    textDecoration: 'underline',
                                                    opacity: 0.8
                                                }
                                            }}
                                        >
                                            {r.rating} ★
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{r.createdAt?.slice(0, 10)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {r.active === false || r.active === 0 ? (
                                        <span style={{ color: 'red' }}>Inactive</span>
                                    ) : (
                                        <span style={{ color: 'green' }}>Active</span>
                                    )}
                                </TableCell>
                                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    <Tooltip title="Reply">
                                        <span>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenReplyModal(r)}
                                                disabled={r.replies && r.replies.length > 0}
                                            >
                                                <ReadFilled />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Change Status">
                                        <IconButton color="error" onClick={() => handleDelete(r.id)}>
                                            <DeleteOutlined />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredReviews.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No reviews found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredReviews.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            <Modal
                open={replyModalOpen}
                onClose={handleCloseReplyModal}
                aria-labelledby="reply-modal-title"
            >
                <Box sx={modalStyle}>
                    <Typography id="reply-modal-title" variant="h6" component="h2">
                        Reply to Review by {selectedReview?.authorName}
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        margin="normal"
                        label="Your Reply"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseReplyModal} sx={{ mr: 1 }}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmitReply}
                            disabled={isSubmittingReply}
                        >
                            {isSubmittingReply ? <CircularProgress size={24} /> : 'Submit Reply'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </MainCard>
    );
};

export default ReviewList;