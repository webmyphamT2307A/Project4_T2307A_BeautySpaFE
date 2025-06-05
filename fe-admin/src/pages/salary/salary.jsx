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
  Checkbox, // Added missing import
  FormControlLabel // Added missing import
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
          toast.error(response.message || "Failed to load staff list.");
        }
      })
      .catch(() => {
        setUsers([]);
        toast.error("Error loading staff list.");
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
            toast.info(response.message || 'No salary records found for the current filter.');
          }
        }
      })
      .catch(() => {
        setSalaries([]);
        toast.error('Error loading salary records.');
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
      toast.error("Please select Employee, Month, and Year.");
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
        toast.success(response.message || "Salary calculated and saved successfully!");
        fetchSalaries();
        handleCloseCalculateDialog();
      } else {
        toast.error(response.message || "Failed to calculate salary.");
      }
    })
    .catch(() => toast.error("Error calculating salary."))
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
        toast.success(response.message || "Salary record updated successfully!");
        fetchSalaries();
        handleCloseEditDialog();
      } else {
        toast.error(response.message || "Failed to update salary record.");
      }
    })
    .catch(() => toast.error("Error updating salary record."))
    .finally(() => setLoading(false));
  };

  const handleDeleteSalary = (salaryId) => {
    if (window.confirm('Are you sure you want to deactivate this salary record?')) {
      setLoading(true);
      fetch(`${SALARY_API_URL}/${salaryId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(response => {
          if (response.status === 'SUCCESS') {
            toast.success(response.message || "Salary record deactivated successfully.");
            fetchSalaries();
          } else {
            toast.error(response.message || "Failed to deactivate salary record.");
          }
        })
        .catch(() => toast.error("Error deactivating salary record."))
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
    <MainCard title="Salary Management" secondary={
      <Button
        variant="contained"
        color="primary"
        startIcon={<CalculatorOutlined />}
        onClick={handleOpenCalculateDialog}
        sx={{ borderRadius: '8px' }}
      >
        Calculate Salary
      </Button>
    }>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Employee, Month, Year..."
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
              <InputLabel>Filter by Employee</InputLabel>
              <Select name="userId" value={filterControls.userId} label="Filter by Employee" onChange={handleFilterChange}>
                <MenuItem value=""><em>All Staff</em></MenuItem>
                {users.map(user => <MenuItem key={user.id} value={user.id}>{user.fullName || user.username}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth size="small" name="month" label="Filter by Month" type="number" value={filterControls.month} onChange={handleFilterChange} InputProps={{ sx: { borderRadius: '8px' } }}/>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField fullWidth size="small" name="year" label="Filter by Year" type="number" value={filterControls.year} onChange={handleFilterChange} InputProps={{ sx: { borderRadius: '8px' } }}/>
          </Grid>
           <Grid item xs={12} sm={2}>
            <Button fullWidth variant="outlined" onClick={fetchSalaries} sx={{ borderRadius: '8px' }}>Apply Filters</Button>
          </Grid>
        </Grid>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

      <TableContainer component={Paper} sx={{ boxShadow: '1px 1px 5px rgba(0,0,0,0.1)', borderRadius: '10px', maxHeight: 'calc(100vh - 450px)', overflow: 'auto' }}>
        <Table sx={{ minWidth: 900 }} stickyHeader aria-label="sticky salary table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Month/Year</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Base Salary</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Bonus</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Deductions</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Net Salary</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Payment Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
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
                      {salary.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(salary)}>
                        <EditOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Deactivate">
                      <IconButton size="small" color="error" onClick={() => handleDeleteSalary(salary.id)}>
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {searchedSalaries.length === 0 && !loading && (
                <TableRow><TableCell colSpan={10} align="center"><Typography sx={{p:2}}>No salary data found.</Typography></TableCell></TableRow>
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
        <DialogTitle sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)'}}>Calculate New Salary</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="calc-userId-label">Employee (STAFF)</InputLabel>
            <Select labelId="calc-userId-label" name="userId" value={calculateFormData.userId} label="Employee (STAFF)" onChange={handleCalculateFormChange}>
              <MenuItem value=""><em>Select Employee</em></MenuItem>
              {users.map(user => <MenuItem key={user.id} value={user.id}>{user.fullName || user.username}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField margin="dense" name="month" label="Month (1-12)" type="number" fullWidth value={calculateFormData.month} onChange={handleCalculateFormChange} required />
          <TextField margin="dense" name="year" label="Year (YYYY)" type="number" fullWidth value={calculateFormData.year} onChange={handleCalculateFormChange} required />
          <TextField margin="dense" name="manualBonus" label="Manual Bonus/Commission" type="number" fullWidth value={calculateFormData.manualBonus} onChange={handleCalculateFormChange} helperText="Additional bonus or commission amount." />
          <TextField margin="dense" name="manualDeductions" label="Other Manual Deductions" type="number" fullWidth value={calculateFormData.manualDeductions} onChange={handleCalculateFormChange} helperText="Deductions not automatically calculated (e.g., advances)." />
          <TextField margin="dense" name="notesForCalculation" label="Calculation Notes" type="text" fullWidth multiline rows={2} value={calculateFormData.notesForCalculation} onChange={handleCalculateFormChange} />
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid rgba(224, 224, 224, 1)'}}>
          <Button onClick={handleCloseCalculateDialog} variant="outlined" color="secondary" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleCalculateSalary} variant="contained" color="primary" sx={{ borderRadius: '8px' }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Calculate & Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {currentSalaryRecord && (
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '10px' } }}>
          <DialogTitle sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)'}}>
            Edit Salary Record for {currentSalaryRecord.userName} ({currentSalaryRecord.month}/{currentSalaryRecord.year})
          </DialogTitle>
          <DialogContent sx={{ pt: '20px !important' }}>
            <Typography variant="subtitle2" gutterBottom>Note: Employee, Month, and Year cannot be changed. For corrections, core salary components should ideally be recalculated.</Typography>
            <TextField margin="dense" name="baseSalary" label="Base Salary (Actual)" type="number" fullWidth value={editFormData.baseSalary} onChange={handleEditFormChange} />
            <TextField margin="dense" name="bonus" label="Bonus/Commission" type="number" fullWidth value={editFormData.bonus} onChange={handleEditFormChange} />
            <TextField margin="dense" name="deductions" label="Total Deductions" type="number" fullWidth value={editFormData.deductions} onChange={handleEditFormChange} />
            <TextField margin="dense" name="totalSalary" label="Net Salary" type="number" fullWidth value={editFormData.totalSalary} onChange={handleEditFormChange} InputProps={{ readOnly: true }} helperText="Usually recalculated by the system." />
            <TextField margin="dense" name="paymentDate" label="Payment Date" type="date" fullWidth value={editFormData.paymentDate} onChange={handleEditFormChange} InputLabelProps={{ shrink: true }}/>
            <TextField margin="dense" name="notes" label="Notes" type="text" fullWidth multiline rows={2} value={editFormData.notes} onChange={handleEditFormChange} />
            <FormControlLabel
                control={<Checkbox checked={editFormData.isActive} onChange={handleEditFormChange} name="isActive" />}
                label="Is Active"
                sx={{mt: 1}}
            />
          </DialogContent>
          <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid rgba(224, 224, 224, 1)'}}>
            <Button onClick={handleCloseEditDialog} variant="outlined" color="secondary" sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button onClick={handleUpdateSalary} variant="contained" color="primary" sx={{ borderRadius: '8px' }} disabled={loading}>
             {loading ? <CircularProgress size={24} /> : "Update Record"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </MainCard>
  );
};

export default SalaryManager;
