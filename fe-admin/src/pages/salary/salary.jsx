import { useState, useEffect } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Box,
  Typography,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Checkbox,
  FormControlLabel 
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const SALARY_API_URL = `${API_BASE_URL}/salaries`;
const USER_API_URL = `${API_BASE_URL}/admin/accounts/find-all`;
const STAFF_ROLE_NAME = "STAFF";

const SalaryManager = () => {
  const [salaries, setSalaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCalculateDialog, setOpenCalculateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentSalaryRecord, setCurrentSalaryRecord] = useState(null);

  const [calculateFormData, setCalculateFormData] = useState({
    userId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    manualBonus: '',
    manualDeductions: '',
    notesForCalculation: ''
  });

  const [editFormData, setEditFormData] = useState({
    baseSalary: '',
    bonus: '',
    deductions: '',
    totalSalary: '',
    paymentDate: '',
    notes: '',
    isActive: true
  });

  const [filterControls, setFilterControls] = useState({
    userId: '',
    month: '',
    year: ''
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetch(USER_API_URL)
      .then(res => res.json())
      .then(response => {
        if (response && response.status === 'SUCCESS' && Array.isArray(response.data)) {
          const allUsers = response.data;
          const staffUsers = allUsers.filter(user =>
            user.role && user.role.name && user.role.name.toUpperCase() === STAFF_ROLE_NAME.toUpperCase()
          );
          setUsers(staffUsers);
        } else {
          setUsers([]);
          toast.error(response.message || "Tải danh sách nhân viên thất bại.");
        }
      })
      .catch(() => {
        setUsers([]);
        toast.error("Lỗi khi tải danh sách nhân viên.");
      });
  }, []);

  const fetchSalaries = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterControls.userId) params.append('userId', filterControls.userId);
    if (filterControls.month) params.append('month', filterControls.month);
    if (filterControls.year) params.append('year', filterControls.year);

    let url = SALARY_API_URL;
    if (params.toString()) {
      url += `/findSalary?${params.toString()}`;
    } else {
      url += `/findSalary`;
    }

    fetch(url)
      .then(res => res.json())
      .then(response => {
        if (response.status === 'SUCCESS' && Array.isArray(response.data)) {
          setSalaries(response.data);
        } else {
          setSalaries([]);
          if(filterControls.userId || filterControls.month || filterControls.year) {
            toast.info(response.message || 'Không tìm thấy bản ghi lương nào cho bộ lọc hiện tại.');
          }
        }
      })
      .catch(() => {
        setSalaries([]);
        toast.error('Lỗi khi tải bản ghi lương.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSalaries();
  }, [filterControls]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterControls(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleCalculateFormChange = (event) => {
    const { name, value } = event.target;
    setCalculateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOpenCalculateDialog = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    setCalculateFormData({
      userId: '',
      month: currentMonth,
      year: currentYear,
      manualBonus: '0',
      manualDeductions: '0',
      notesForCalculation: ''
    });
    setOpenCalculateDialog(true);
  };

  const handleCloseCalculateDialog = () => setOpenCalculateDialog(false);

  const handleOpenEditDialog = (salaryRecord) => {
    setCurrentSalaryRecord(salaryRecord);
    setEditFormData({
      baseSalary: salaryRecord.baseSalary || '',
      bonus: salaryRecord.bonus || '',
      deductions: salaryRecord.deductions || '',
      totalSalary: salaryRecord.totalSalary || '',
      paymentDate: salaryRecord.paymentDate || '',
      notes: salaryRecord.notes || '',
      isActive: salaryRecord.isActive === undefined ? true : salaryRecord.isActive,
    });
    setOpenEditDialog(true);
  };
  const handleCloseEditDialog = () => setOpenEditDialog(false);

  const handleCalculateSalary = () => {
    if (!calculateFormData.userId || !calculateFormData.month || !calculateFormData.year) {
      toast.error("Vui lòng chọn Nhân viên, Tháng và Năm.");
      return;
    }
    const payload = {
      userId: Number(calculateFormData.userId),
      month: parseInt(calculateFormData.month, 10),
      year: parseInt(calculateFormData.year, 10),
      manualBonus: parseFloat(calculateFormData.manualBonus) || 0,
      manualDeductions: parseFloat(calculateFormData.manualDeductions) || 0,
      notesForCalculation: calculateFormData.notesForCalculation
    };

    setLoading(true);
    fetch(`${SALARY_API_URL}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(response => {
      if (response.status === 'SUCCESS') {
        toast.success(response.message || "Đã tính và lưu lương thành công!");
        fetchSalaries();
        handleCloseCalculateDialog();
      } else {
        toast.error(response.message || "Tính lương thất bại.");
      }
    })
    .catch(() => toast.error("Lỗi khi tính lương."))
    .finally(() => setLoading(false));
  };

  const handleUpdateSalary = () => {
    if (!currentSalaryRecord) return;

    const payload = {
      userId: currentSalaryRecord.userId,
      month: currentSalaryRecord.month,
      year: currentSalaryRecord.year,
      baseSalary: parseFloat(editFormData.baseSalary) || 0,
      bonus: parseFloat(editFormData.bonus) || 0,
      deductions: parseFloat(editFormData.deductions) || 0,
      totalSalary: parseFloat(editFormData.totalSalary) || 0,
      paymentDate: editFormData.paymentDate,
      notes: editFormData.notes,
      isActive: editFormData.isActive
    };

    setLoading(true);
    fetch(`${SALARY_API_URL}/update/${currentSalaryRecord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(response => {
      if (response.status === 'SUCCESS') {
        toast.success(response.message || "Cập nhật bản ghi lương thành công!");
        fetchSalaries();
        handleCloseEditDialog();
      } else {
        toast.error(response.message || "Cập nhật bản ghi lương thất bại.");
      }
    })
    .catch(() => toast.error("Lỗi khi cập nhật bản ghi lương."))
    .finally(() => setLoading(false));
  };

  const handleDeleteSalary = (salaryId) => {
    if (confirm('Bạn có chắc chắn muốn vô hiệu hóa bản ghi lương này?')) {
      setLoading(true);
      fetch(`${SALARY_API_URL}/${salaryId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            toast.success(response.message || "Vô hiệu hóa bản ghi lương thành công.");
            fetchSalaries();
          } else {
            toast.error(response.message || "Vô hiệu hóa bản ghi lương thất bại.");
          }
        })
        .catch(() => toast.error("Lỗi khi vô hiệu hóa bản ghi lương."))
        .finally(() => setLoading(false));
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const searchedSalaries = salaries.filter(salary =>
    (salary.userName && salary.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (salary.month && String(salary.month).includes(searchQuery)) ||
    (salary.year && String(salary.year).includes(searchQuery))
  );

  return (
    <MainCard title="Quản Lý Tiền Lương" secondary={
      <Button
        variant="contained"
        color="primary"
        startIcon={<CalculatorOutlined />}
        onClick={handleOpenCalculateDialog}
        sx={{ borderRadius: '8px' }}
      >
        Tính Lương
      </Button>
    }>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm theo nhân viên, tháng, năm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchOutlined /></InputAdornment>),
                endAdornment: searchQuery ? (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery('')}><CloseOutlined style={{fontSize: 16}} /></IconButton></InputAdornment>) : null,
                sx: { borderRadius: '8px' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
              <InputLabel>Lọc Theo Nhân Viên</InputLabel>
              <Select name="userId" value={filterControls.userId} label="Lọc Theo Nhân Viên" onChange={handleFilterChange}>
                <MenuItem value=""><em>Tất Cả Nhân Viên</em></MenuItem>
                {users.map(user => <MenuItem key={user.id} value={user.id}>{user.fullName || user.username}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth size="small" name="month" label="Lọc Theo Tháng" type="number" value={filterControls.month} onChange={handleFilterChange} InputProps={{ sx: { borderRadius: '8px' } }}/>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth size="small" name="year" label="Lọc Theo Năm" type="number" value={filterControls.year} onChange={handleFilterChange} InputProps={{ sx: { borderRadius: '8px' } }}/>
          </Grid>
           <Grid item xs={12} sm={2}>
            <Button fullWidth variant="outlined" onClick={fetchSalaries} sx={{ borderRadius: '8px' }}>Áp Dụng Bộ Lọc</Button>
          </Grid>
        </Grid>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

      <TableContainer component={Paper} sx={{ boxShadow: '1px 1px 5px rgba(0,0,0,0.1)', borderRadius: '10px', maxHeight: 'calc(100vh - 450px)', overflow: 'auto', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1800, width: '100%' }} stickyHeader aria-label="sticky salary table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nhân Viên</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tháng/Năm</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Lương Cơ Bản</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Thưởng</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Khấu Trừ</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Lương Thực Nhận</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ngày Thanh Toán</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Trạng Thái</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {searchedSalaries
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((salary, index) => (
                <TableRow hover key={salary.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{salary.userName}</TableCell>
                  <TableCell>{`${salary.month}/${salary.year}`}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{salary.baseSalary?.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{salary.bonus?.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>{salary.deductions?.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>{salary.totalSalary?.toLocaleString()}</TableCell>
                  <TableCell>{salary.paymentDate}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: salary.isActive ? 'success.main' : 'error.main', fontWeight: 'medium' }}>
                      {salary.isActive ? 'Hoạt Động' : 'Không Hoạt Động'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Chỉnh Sửa">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(salary)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hủy Kích Hoạt">
                      <IconButton size="small" color="error" onClick={() => handleDeleteSalary(salary.id)}>
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {searchedSalaries.length === 0 && !loading && (
                <TableRow><TableCell colSpan={10} align="center"><Typography sx={{p:2}}>Không tìm thấy dữ liệu lương.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={searchedSalaries.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ mt: 2, borderTop: '1px solid rgba(224, 224, 224, 1)' }}
      />

      <Dialog open={openCalculateDialog} onClose={handleCloseCalculateDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '10px' } }}>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)'}}>Tính Lương Mới</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="calc-userId-label">Nhân viên (STAFF)</InputLabel>
            <Select labelId="calc-userId-label" name="userId" value={calculateFormData.userId} label="Nhân viên (STAFF)" onChange={handleCalculateFormChange}>
              <MenuItem value=""><em>Chọn Nhân Viên</em></MenuItem>
              {users.map(user => <MenuItem key={user.id} value={user.id}>{user.fullName || user.username}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField margin="dense" name="month" label="Tháng (1-12)" type="number" fullWidth value={calculateFormData.month} onChange={handleCalculateFormChange} required />
          <TextField margin="dense" name="year" label="Năm (YYYY)" type="number" fullWidth value={calculateFormData.year} onChange={handleCalculateFormChange} required />
          <TextField margin="dense" name="manualBonus" label="Thưởng / Hoa hồng thủ công" type="number" fullWidth value={calculateFormData.manualBonus} onChange={handleCalculateFormChange} helperText="Khoản thưởng hoặc hoa hồng bổ sung." />
          <TextField margin="dense" name="manualDeductions" label="Các khoản khấu trừ thủ công khác" type="number" fullWidth value={calculateFormData.manualDeductions} onChange={handleCalculateFormChange} helperText="Các khoản khấu trừ không được tính tự động (ví dụ: tạm ứng)." />
          <TextField margin="dense" name="notesForCalculation" label="Ghi chú tính lương" type="text" fullWidth multiline rows={2} value={calculateFormData.notesForCalculation} onChange={handleCalculateFormChange} />
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid rgba(224, 224, 224, 1)'}}>
          <Button onClick={handleCloseCalculateDialog} variant="outlined" color="secondary" sx={{ borderRadius: '8px' }}>Hủy</Button>
          <Button onClick={handleCalculateSalary} variant="contained" color="primary" sx={{ borderRadius: '8px' }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Tính & Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      {currentSalaryRecord && (
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '10px' } }}>
          <DialogTitle sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)'}}>
            Chỉnh Sửa Bản Ghi Lương cho {currentSalaryRecord.userName} ({currentSalaryRecord.month}/{currentSalaryRecord.year})
          </DialogTitle>
          <DialogContent sx={{ pt: '20px !important' }}>
            <Typography variant="subtitle2" gutterBottom>Lưu ý: Không thể thay đổi Nhân viên, Tháng và Năm. Để sửa đổi, các thành phần lương cốt lõi nên được tính toán lại.</Typography>
            <TextField margin="dense" name="baseSalary" label="Lương Cơ Bản (Thực tế)" type="number" fullWidth value={editFormData.baseSalary} onChange={handleEditFormChange} />
            <TextField margin="dense" name="bonus" label="Thưởng / Hoa hồng" type="number" fullWidth value={editFormData.bonus} onChange={handleEditFormChange} />
            <TextField margin="dense" name="deductions" label="Tổng khấu trừ" type="number" fullWidth value={editFormData.deductions} onChange={handleEditFormChange} />
            <TextField margin="dense" name="totalSalary" label="Lương thực nhận" type="number" fullWidth value={editFormData.totalSalary} onChange={handleEditFormChange} InputProps={{ readOnly: true }} helperText="Thường được hệ thống tính toán lại." />
            <TextField margin="dense" name="paymentDate" label="Ngày thanh toán" type="date" fullWidth value={editFormData.paymentDate} onChange={handleEditFormChange} InputLabelProps={{ shrink: true }}/>
            <TextField margin="dense" name="notes" label="Ghi chú" type="text" fullWidth multiline rows={2} value={editFormData.notes} onChange={handleEditFormChange} />
            <FormControlLabel
                control={<Checkbox checked={editFormData.isActive} onChange={handleEditFormChange} name="isActive" />}
                label="Kích hoạt"
                sx={{mt: 1}}
            />
          </DialogContent>
          <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid rgba(224, 224, 224, 1)'}}>
            <Button onClick={handleCloseEditDialog} variant="outlined" color="secondary" sx={{ borderRadius: '8px' }}>Hủy</Button>
            <Button onClick={handleUpdateSalary} variant="contained" color="primary" sx={{ borderRadius: '8px' }} disabled={loading}>
             {loading ? <CircularProgress size={24} /> : "Cập nhật bản ghi"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </MainCard>
  );
};

export default SalaryManager;
