import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Tabs,
  Tab, TablePagination
} from '@mui/material';
import { AddOutlined, EditOutlined, DeleteOutlined, CloseOutlined } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';

const SkillManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('1');
  const [employeePage, setEmployeePage] = useState(0);
  const [employeeRowsPerPage, setEmployeeRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillPage, setSkillPage] = useState(0);
  const [skillRowsPerPage, setSkillRowsPerPage] = useState(10);

  // Bộ lọc
  const [filterEmployees, setFilterEmployees] = useState([]); // mảng id nhân viên được chọn lọc
  const [filterSkills, setFilterSkills] = useState([]);       // mảng id kỹ năng được chọn lọc

  // State gán/sửa kỹ năng cho nhân viên
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  // State cho dialog tạo/sửa/xóa kỹ năng
  const [openNewSkillDialog, setOpenNewSkillDialog] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  
  const [openEditSkillDialog, setOpenEditSkillDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [isUpdatingSkill, setIsUpdatingSkill] = useState(false);

  const [deletingSkillId, setDeletingSkillId] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('http://localhost:8080/api/v1/user/accounts/staff'),
      axios.get('http://localhost:8080/api/v1/skills'),
      axios.get('http://localhost:8080/api/v1/user-skills'),
    ])
      .then(([employeeRes, skillRes, userSkillRes]) => {
        setEmployees(employeeRes.data);
        setSkills(skillRes.data);
        setUserSkills(userSkillRes.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        toast.error('Lỗi tải dữ liệu');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function loadData() {
    Promise.all([
      axios.get('http://localhost:8080/api/v1/user/accounts/staff'),
      axios.get('http://localhost:8080/api/v1/skills'),
      axios.get('http://localhost:8080/api/v1/user-skills'),
    ])
      .then(([employeeRes, skillRes, userSkillRes]) => {
        setEmployees(employeeRes.data);
        setSkills(skillRes.data);
        setUserSkills(userSkillRes.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        toast.error('Lỗi tải dữ liệu');
      })
      .finally(() => {
      });
  }
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // --- Handlers for User-Skill Assignment ---
  const handleOpenAssignDialog = (type, employee = null) => {
    setDialogType(type);
    if (type === 'add') {
      setSelectedEmployeeIds([]);
      setSelectedSkills([]);
    } else {
      setSelectedEmployeeIds([employee.id]);
      setSelectedSkills(
        userSkills
          .filter((us) => us.id.userId === employee.id)
          .map((us) => us.skill.id)
      );
    }
    setSelectedEmployee(employee);
    setOpenAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    if (!saving) {
      setOpenAssignDialog(false);
      setSelectedEmployee(null);
      setSelectedSkills([]);
      setSelectedEmployeeIds([]);
    }
  };

  const handleSaveAssignment = () => {
    const userIds = dialogType === 'edit' ? [selectedEmployee.id] : selectedEmployeeIds;

    if (userIds.length === 0) {
      toast.warn('Vui lòng chọn nhân viên');
      return;
    }

    if (selectedSkills.length === 0) {
      toast.warn('Vui lòng chọn kỹ năng');
      return;
    }

    setSaving(true);

    const requests = userIds.map((id) => {
      const payload = { userId: id, skillIds: selectedSkills };
      if (dialogType === 'add') {
        axios.post('http://localhost:8080/api/v1/user-skills/insert', payload);
        loadData();
      } else {
        axios.put(`http://localhost:8080/api/v1/user-skills/edit`, payload);
        loadData();
      }
    });

    Promise.all(requests)
      .then(() => axios.get('http://localhost:8080/api/v1/user-skills'))
      .then((res) => {
        setUserSkills(res.data);
        toast.success(dialogType === 'add' ? 'Gán kỹ năng thành công' : 'Cập nhật kỹ năng thành công');
        handleCloseAssignDialog();
      })
      .catch((error) => {
        console.error('Lỗi lưu kỹ năng:', error);
        toast.error('Lưu kỹ năng thất bại');
      })
      .finally(() => {
        setSaving(false);
        loadData();
      });
  };

  const handleDeleteAssignment = (employeeId) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: 'Toàn bộ kỹ năng của nhân viên này sẽ bị xóa!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (!result.isConfirmed) return;

      setDeletingIds((prev) => [...prev, employeeId]);

      axios
        .delete(`http://localhost:8080/api/v1/user-skills/delete/${employeeId}`)
        .then(() => axios.get('http://localhost:8080/api/v1/user-skills'))
        .then((res) => {
          setUserSkills(res.data);
          toast.success('Xóa kỹ năng của nhân viên thành công');
        })
        .catch((error) => {
          console.error('Error deleting skills:', error);
          toast.error('Xóa kỹ năng thất bại');
        })
        .finally(() => {
          setDeletingIds((prev) => prev.filter((id) => id !== employeeId));
          loadData();
        });
    });
  };

  // --- Handlers for Skill CRUD ---
  const handleOpenNewSkillDialog = () => {
    setNewSkillName('');
    setOpenNewSkillDialog(true);
  };

  const handleCloseNewSkillDialog = () => {
    if (!isCreatingSkill) setOpenNewSkillDialog(false);
  };

  const handleSaveNewSkill = () => {
    if (!newSkillName.trim()) {
      toast.warn('Vui lòng nhập tên kỹ năng');
      return;
    }
    setIsCreatingSkill(true);
    axios.post('http://localhost:8080/api/v1/skills', { skillName: newSkillName })
      .then(() => {
        toast.success('Thêm kỹ năng mới thành công!');
        handleCloseNewSkillDialog();
        return axios.get('http://localhost:8080/api/v1/skills');
      })
      .then(res => setSkills(res.data))
      .catch(error => {
        console.error('Lỗi khi tạo kỹ năng mới:', error);
        toast.error(error.response?.data?.message || 'Thêm kỹ năng mới thất bại');
      })
      .finally(() => {
        setIsCreatingSkill(false)
      });
  };

  const handleOpenEditSkillDialog = (skill) => {
    setEditingSkill({ ...skill });
    setOpenEditSkillDialog(true);
  };

  const handleCloseEditSkillDialog = () => {
    if (!isUpdatingSkill) {
        setOpenEditSkillDialog(false);
        setEditingSkill(null);
    }
  };

  const handleUpdateSkill = () => {
    if (!editingSkill || !editingSkill.skillName.trim()) {
        toast.warn('Vui lòng nhập tên kỹ năng.');
        return;
    }
    setIsUpdatingSkill(true);
    axios.put(`http://localhost:8080/api/v1/skills/${editingSkill.id}`, { skillName: editingSkill.skillName })
        .then(() => {
          handleCloseEditSkillDialog();
          toast.success('Cập nhật kỹ năng thành công!');
          return axios.get('http://localhost:8080/api/v1/skills');
        })
        .then(res => setSkills(res.data))
        .catch(error => {
            console.error('Lỗi khi cập nhật kỹ năng:', error);
            toast.error(error.response?.data?.message || 'Cập nhật kỹ năng thất bại');
        })
        .finally(() => {
          setIsUpdatingSkill(false)
        });
  };

  const handleDeleteSkill = (skillId) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: 'Kỹ năng này sẽ bị xóa. Kỹ năng đã gán cho nhân viên cũng sẽ bị ảnh hưởng!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    }).then((result) => {
      if (!result.isConfirmed) return;

      setDeletingSkillId(skillId);
      axios.delete(`http://localhost:8080/api/v1/skills/${skillId}`)
        .then(() => {
          toast.success('Xóa kỹ năng thành công!');
          return Promise.all([
            axios.get('http://localhost:8080/api/v1/skills'),
            axios.get('http://localhost:8080/api/v1/user-skills'),
          ]);
        })
        .then(([skillRes, userSkillRes]) => {
          setSkills(skillRes.data);
          setUserSkills(userSkillRes.data);
        })
        .catch(error => {
          console.error('Lỗi khi xóa kỹ năng:', error);
          toast.error(error.response?.data?.message || 'Xóa kỹ năng thất bại.');
        })
        .finally(() => {
          setDeletingSkillId(null)
        });
    });
  };



  // Lọc employees hiển thị theo bộ lọc nhân viên + kỹ năng
  const filteredEmployees = employees.filter((emp) => {
    if (!userSkills.some((us) => us.id.userId === emp.id)) return false;
    if (filterEmployees.length > 0 && !filterEmployees.includes(emp.id)) return false;
    if (filterSkills.length > 0) {
      const empSkillIds = userSkills
        .filter((us) => us.id.userId === emp.id)
        .map((us) => us.skill.id);
      if (!empSkillIds.some((skillId) => filterSkills.includes(skillId))) return false;
    }
    return true;
  });

  const availableEmployees = employees.filter(
    (emp) => !userSkills.some((us) => us.id.userId === emp.id)
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }
  const paginatedEmployees = filteredEmployees.slice(
    employeePage * employeeRowsPerPage,
    employeePage * employeeRowsPerPage + employeeRowsPerPage
  );

  const paginatedSkills = skills.slice(
    skillPage * skillRowsPerPage,
    skillPage * skillRowsPerPage + skillRowsPerPage
  );

  return (
    <MainCard title="Quản Lý Kỹ Năng">
      <Box sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="skill management tabs">
          <Tab label="Kỹ Năng Nhân Viên" value="1" />
          <Tab label="Danh Sách Kỹ Năng" value="2" />
        </Tabs>
      </Box>
      
      {/* Tab 1: Gán kỹ năng cho nhân viên */}
      {tabValue === '1' && (
        <Box sx={{ pt: 2 }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel id="filter-employee-label">Lọc theo Nhân Viên</InputLabel>
                    <Select
                        labelId="filter-employee-label"
                        multiple
                        value={filterEmployees}
                        onChange={(e) => setFilterEmployees(e.target.value)}
                        renderValue={(selected) => selected.map((id) => employees.find((emp) => emp.id === id)?.fullName).join(', ')}
                    >
                        {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                            {emp.fullName}
                            {filterEmployees.includes(emp.id) && (<Chip label="✓" color="success" size="small" sx={{ ml: 1 }} />)}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel id="filter-skill-label">Lọc theo Kỹ Năng</InputLabel>
                    <Select
                        labelId="filter-skill-label"
                        multiple
                        value={filterSkills}
                        onChange={(e) => setFilterSkills(e.target.value)}
                        renderValue={(selected) => selected.map((id) => skills.find((skill) => skill.id === id)?.skillName).join(', ')}
                    >
                        {skills.map((skill) => (
                        <MenuItem key={skill.id} value={skill.id}>
                            {skill.skillName}
                            {filterSkills.includes(skill.id) && (<Chip label="✓" color="success" size="small" sx={{ ml: 1 }} />)}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button variant="contained" startIcon={<AddOutlined />} onClick={() => handleOpenAssignDialog('add')} disabled={saving}>
                        Gán Kỹ Năng
                    </Button>
                </Box>
            </div>
            <TableContainer sx={{ maxHeight: 800 }}>
                <Table>
                <TableHead>
                    <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Tên Nhân Viên</TableCell>
                    <TableCell>Kỹ Năng</TableCell>
                    <TableCell>Hành Động</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedEmployees.map((employee, index) => {
                    const employeeSkills = userSkills
                        .filter((us) => us.id.userId === employee.id)
                        .map((us) => us.skill.skillName);
                    const isDeleting = deletingIds.includes(employee.id);
                    return (
                        <TableRow key={employee.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{employee.fullName}</TableCell>
                        <TableCell>{employeeSkills.map((skill, idx) => (<Chip key={idx} label={skill} sx={{ mr: 1, mb: 1 }} />))}</TableCell>
                        <TableCell>
                            <IconButton color="primary" onClick={() => handleOpenAssignDialog('edit', employee)} disabled={saving || isDeleting}><EditOutlined /></IconButton>
                            <IconButton color="error" onClick={() => handleDeleteAssignment(employee.id)} disabled={saving || isDeleting}>
                                {isDeleting ? <CircularProgress size={24} color="error" /> : <DeleteOutlined />}
                            </IconButton>
                        </TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredEmployees.length}
              page={employeePage}
              onPageChange={(e, newPage) => setEmployeePage(newPage)}
              rowsPerPage={employeeRowsPerPage}
              onRowsPerPageChange={(e) => {
                setEmployeeRowsPerPage(parseInt(e.target.value, 10));
                setEmployeePage(0);
              }}
              rowsPerPageOptions={[5, 10, 20]}
            />

        </Box>
      )}

      {/* Tab 2: Quản lý danh sách kỹ năng */}
      {tabValue === '2' && (
        <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Tìm kiếm kỹ năng"
                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                sx={{ width: '300px' }}
              />
              <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpenNewSkillDialog} disabled={isCreatingSkill}>
                Tạo Kỹ Năng Mới
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 700 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>STT</TableCell>
                            <TableCell>Tên Kỹ Năng</TableCell>
                            <TableCell align="right">Hành Động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {skills
                          .filter((skill) => skill.skillName.toLowerCase().includes(searchTerm))
                          .map((skill, index) => {
                            const isDeleting = deletingSkillId === skill.id;
                            return (
                                <TableRow key={skill.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{skill.skillName}</TableCell>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={() => handleOpenEditSkillDialog(skill)} disabled={isDeleting}><EditOutlined/></IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteSkill(skill.id)} disabled={isDeleting}>
                                            {isDeleting ? <CircularProgress size={24} color="error" /> : <DeleteOutlined/>}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
      )}

      {/* Dialog gán kỹ năng cho nhân viên */}
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'add' ? 'Gán Kỹ Năng cho Nhân Viên' : 'Chỉnh Sửa Kỹ Năng'}
          <IconButton aria-label="close" onClick={handleCloseAssignDialog} disabled={saving} sx={{ position: 'absolute', right: 8, top: 8, }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent>
          {dialogType === 'add' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="employee-label">Chọn Nhân Viên</InputLabel>
              <Select
                labelId="employee-label"
                multiple
                value={selectedEmployeeIds}
                onChange={(e) => setSelectedEmployeeIds(e.target.value)}
                renderValue={(selected) => selected.map((id) => availableEmployees.find((emp) => emp.id === id)?.fullName).join(', ')}
                disabled={saving}
              >
                {availableEmployees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.fullName}
                    {selectedEmployeeIds.includes(emp.id) && (<Chip label="✓" color="success" size="small" sx={{ ml: 1 }}/>)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {dialogType === 'edit' && (<Typography variant="subtitle1" sx={{ mb: 2 }}>Nhân Viên: {selectedEmployee?.fullName}</Typography>)}
          <FormControl fullWidth>
            <InputLabel id="skills-label">Kỹ Năng</InputLabel>
            <Select
              labelId="skills-label"
              multiple
              value={selectedSkills}
              onChange={(e) => setSelectedSkills(e.target.value)}
              renderValue={(selected) => selected.map((id) => skills.find((skill) => skill.id === id)?.skillName).join(', ')}
              disabled={saving}
            >
              {skills.map((skill) => (
                <MenuItem key={skill.id} value={skill.id}>
                  {skill.skillName}
                  {selectedSkills.includes(skill.id) && (<Chip label="✓" color="success" size="small" sx={{ ml: 1 }}/>)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog} variant="outlined" disabled={saving}>Hủy</Button>
          <Button onClick={handleSaveAssignment} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog tạo kỹ năng mới */}
      <Dialog open={openNewSkillDialog} onClose={handleCloseNewSkillDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          Tạo Kỹ Năng Mới
          <IconButton aria-label="close" onClick={handleCloseNewSkillDialog} disabled={isCreatingSkill} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" id="skillName" label="Tên Kỹ Năng" type="text" fullWidth variant="outlined" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} disabled={isCreatingSkill}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewSkillDialog} variant="outlined" disabled={isCreatingSkill}>Hủy</Button>
          <Button onClick={handleSaveNewSkill} variant="contained" disabled={isCreatingSkill}>
            {isCreatingSkill ? <CircularProgress size={24} color="inherit" /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog sửa kỹ năng */}
      <Dialog open={openEditSkillDialog} onClose={handleCloseEditSkillDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          Sửa Tên Kỹ Năng
          <IconButton aria-label="close" onClick={handleCloseEditSkillDialog} disabled={isUpdatingSkill} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent>
            <TextField 
                autoFocus 
                margin="dense" 
                id="editingSkillName" 
                label="Tên Kỹ Năng" 
                type="text" 
                fullWidth variant="outlined" 
                value={editingSkill?.skillName || ''} 
                onChange={(e) => setEditingSkill(prev => ({ ...prev, skillName: e.target.value }))}
                disabled={isUpdatingSkill}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditSkillDialog} variant="outlined" disabled={isUpdatingSkill}>Hủy</Button>
          <Button onClick={handleUpdateSkill} variant="contained" disabled={isUpdatingSkill}>
            {isUpdatingSkill ? <CircularProgress size={24} color="inherit" /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>


      <ToastContainer position="top-right" autoClose={2000} />
    </MainCard>
  );
};

export default SkillManagement;