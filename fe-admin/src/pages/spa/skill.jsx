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
  Tab,
} from '@mui/material';
import { AddOutlined, EditOutlined, DeleteOutlined, CloseOutlined } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SkillManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('1');

  // Bộ lọc
  const [filterEmployees, setFilterEmployees] = useState([]);
  const [filterSkills, setFilterSkills] = useState([]);

  // State gán/sửa kỹ năng cho nhân viên
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  // State cho dialog tạo/sửa/xóa kỹ năng
  const [openSkillDialog, setOpenSkillDialog] = useState(false);
  const [skillDialogType, setSkillDialogType] = useState('add');
  const [currentSkill, setCurrentSkill] = useState({ id: null, skillName: '', description: '' });
  const [isProcessingSkill, setIsProcessingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState(null);

  const fetchAllData = () => {
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
  };

  useEffect(() => {
    fetchAllData();
  }, []);

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

    if (userIds.length === 0 || selectedSkills.length === 0) {
      toast.warn('Vui lòng chọn nhân viên và kỹ năng');
      return;
    }

    setSaving(true);
    const requests = userIds.map((id) => {
      const payload = { userId: id, skillIds: selectedSkills };
      return dialogType === 'add'
        ? axios.post('http://localhost:8080/api/v1/user-skills/insert', payload)
        : axios.put(`http://localhost:8080/api/v1/user-skills/edit`, payload);
    });

    Promise.all(requests)
      .then(() => {
        toast.success(dialogType === 'add' ? 'Gán kỹ năng thành công' : 'Cập nhật kỹ năng thành công');
        handleCloseAssignDialog();
        fetchAllData();
      })
      .catch((error) => {
        console.error('Lỗi lưu kỹ năng:', error);
        toast.error('Lưu kỹ năng thất bại');
      })
      .finally(() => setSaving(false));
  };

  const handleDeleteAssignment = (employeeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ kỹ năng của nhân viên này?')) return;
    setDeletingIds((prev) => [...prev, employeeId]);
    axios
      .delete(`http://localhost:8080/api/v1/user-skills/delete/${employeeId}`)
      .then(() => {
        toast.success('Xóa kỹ năng của nhân viên thành công');
        fetchAllData();
      })
      .catch((error) => {
        console.error('Error deleting skills:', error);
        toast.error('Xóa kỹ năng thất bại');
      })
      .finally(() => setDeletingIds((prev) => prev.filter((id) => id !== employeeId)));
  };

  // --- Handlers for Skill CRUD ---
  const handleOpenSkillDialog = (type, skill = null) => {
    setSkillDialogType(type);
    if (type === 'add') {
      setCurrentSkill({ id: null, skillName: '', description: '' });
    } else {
      setCurrentSkill(skill);
    }
    setOpenSkillDialog(true);
  };

  const handleCloseSkillDialog = () => {
    if (!isProcessingSkill) setOpenSkillDialog(false);
  };
  
  const handleSaveSkill = () => {
    if (!currentSkill.skillName.trim()) {
        toast.warn('Vui lòng nhập tên kỹ năng');
        return;
    }
    setIsProcessingSkill(true);

    const payload = {
        skillName: currentSkill.skillName,
        description: currentSkill.description
    };

    const request = skillDialogType === 'add'
        ? axios.post('http://localhost:8080/api/v1/skills', payload)
        : axios.put(`http://localhost:8080/api/v1/skills/${currentSkill.id}`, payload);

    request
        .then(() => {
            toast.success(skillDialogType === 'add' ? 'Thêm kỹ năng thành công!' : 'Cập nhật kỹ năng thành công!');
            handleCloseSkillDialog();
            fetchAllData();
        })
        .catch(error => {
            console.error('Lỗi khi xử lý kỹ năng:', error);
            toast.error(error.response?.data?.message || 'Xử lý kỹ năng thất bại');
        })
        .finally(() => setIsProcessingSkill(false));
  };


  const handleDeleteSkill = (skillId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kỹ năng này không? Thao tác này sẽ xóa kỹ năng khỏi tất cả nhân viên đã được gán.')) {
        return;
    }
    setDeletingSkillId(skillId);
    axios.delete(`http://localhost:8080/api/v1/skills/${skillId}`)
        .then(() => {
            toast.success('Xóa kỹ năng thành công!');
            fetchAllData();
        })
        .catch(error => {
            console.error('Lỗi khi xóa kỹ năng:', error);
            toast.error(error.response?.data?.message || 'Xóa kỹ năng thất bại.');
        })
        .finally(() => setDeletingSkillId(null));
  };

  const filteredEmployees = employees.filter((emp) => {
    const hasSkills = userSkills.some((us) => us.id.userId === emp.id);
    if (!hasSkills) return false;
    if (filterEmployees.length > 0 && !filterEmployees.includes(emp.id)) return false;
    if (filterSkills.length > 0) {
      const empSkillIds = userSkills.filter((us) => us.id.userId === emp.id).map((us) => us.skill.id);
      return empSkillIds.some((skillId) => filterSkills.includes(skillId));
    }
    return true;
  });

  const availableEmployees = employees.filter(emp => !userSkills.some(us => us.id.userId === emp.id));

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <MainCard title="Quản Lý Kỹ Năng">
      <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="skill management tabs">
          <Tab label="Kỹ Năng Nhân Viên" value="1" />
          <Tab label="Danh Sách Kỹ Năng" value="2" />
        </Tabs>
      </Box>
      
      {/* Tab 1: Gán kỹ năng cho nhân viên */}
      <Box sx={{ pt: 2, display: tabValue === '1' ? 'block' : 'none' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Lọc theo Nhân Viên</InputLabel>
                    <Select multiple value={filterEmployees} onChange={(e) => setFilterEmployees(e.target.value)} renderValue={(selected) => selected.map((id) => employees.find((emp) => emp.id === id)?.fullName).join(', ')}>
                        {employees.map((emp) => (<MenuItem key={emp.id} value={emp.id}>{emp.fullName}</MenuItem>))}
                    </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Lọc theo Kỹ Năng</InputLabel>
                    <Select multiple value={filterSkills} onChange={(e) => setFilterSkills(e.target.value)} renderValue={(selected) => selected.map((id) => skills.find((skill) => skill.id === id)?.skillName).join(', ')}>
                        {skills.map((skill) => (<MenuItem key={skill.id} value={skill.id}>{skill.skillName}</MenuItem>))}
                    </Select>
                    </FormControl>
                </Box>
                <Box sx={{ mb: 2 }}>
                    <Button variant="contained" startIcon={<AddOutlined />} onClick={() => handleOpenAssignDialog('add')}>Gán Kỹ Năng</Button>
                </Box>
            </div>
            <TableContainer>
                <Table>
                <TableHead><TableRow><TableCell>STT</TableCell><TableCell>Tên Nhân Viên</TableCell><TableCell>Kỹ Năng</TableCell><TableCell>Hành Động</TableCell></TableRow></TableHead>
                <TableBody>
                    {filteredEmployees.map((employee, index) => {
                    const employeeSkills = userSkills.filter((us) => us.id.userId === employee.id).map((us) => us.skill.skillName);
                    const isDeleting = deletingIds.includes(employee.id);
                    return (
                        <TableRow key={employee.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{employee.fullName}</TableCell>
                        <TableCell>{employeeSkills.map((skill, idx) => (<Chip key={idx} label={skill} sx={{ mr: 1, mb: 1 }} />))}</TableCell>
                        <TableCell>
                            <IconButton color="primary" onClick={() => handleOpenAssignDialog('edit', employee)} disabled={isDeleting}><EditOutlined /></IconButton>
                            <IconButton color="error" onClick={() => handleDeleteAssignment(employee.id)} disabled={isDeleting}>
                                {isDeleting ? <CircularProgress size={24} color="error" /> : <DeleteOutlined />}
                            </IconButton>
                        </TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
                </Table>
            </TableContainer>
      </Box>

      {/* Tab 2: Quản lý danh sách kỹ năng */}
      <Box sx={{ pt: 2, display: tabValue === '2' ? 'block' : 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddOutlined />} onClick={() => handleOpenSkillDialog('add')}>Tạo Kỹ Năng Mới</Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead><TableRow><TableCell>STT</TableCell><TableCell>Tên Kỹ Năng</TableCell><TableCell>Mô tả</TableCell><TableCell align="right">Hành Động</TableCell></TableRow></TableHead>
                    <TableBody>
                        {skills.map((skill, index) => {
                            const isDeleting = deletingSkillId === skill.id;
                            return (
                                <TableRow key={skill.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{skill.skillName}</TableCell>
                                    <TableCell>{skill.description}</TableCell>
                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={() => handleOpenSkillDialog('edit', skill)} disabled={isDeleting}><EditOutlined/></IconButton>
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

      {/* Dialog gán kỹ năng cho nhân viên */}
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogType === 'add' ? 'Gán Kỹ Năng' : 'Chỉnh Sửa Kỹ Năng'}<IconButton onClick={handleCloseAssignDialog} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton></DialogTitle>
        <DialogContent>
          {dialogType === 'add' && (
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}><InputLabel>Chọn Nhân Viên</InputLabel>
              <Select multiple value={selectedEmployeeIds} onChange={(e) => setSelectedEmployeeIds(e.target.value)} renderValue={(selected) => selected.map((id) => availableEmployees.find((emp) => emp.id === id)?.fullName).join(', ')}>
                {availableEmployees.map((emp) => (<MenuItem key={emp.id} value={emp.id}>{emp.fullName}</MenuItem>))}
              </Select>
            </FormControl>
          )}
          {dialogType === 'edit' && (<Typography variant="subtitle1" sx={{ mb: 2 }}>Nhân Viên: {selectedEmployee?.fullName}</Typography>)}
          <FormControl fullWidth>
            <InputLabel>Kỹ Năng</InputLabel>
            <Select multiple value={selectedSkills} onChange={(e) => setSelectedSkills(e.target.value)} renderValue={(selected) => selected.map((id) => skills.find((skill) => skill.id === id)?.skillName).join(', ')}>
              {skills.map((skill) => (<MenuItem key={skill.id} value={skill.id}>{skill.skillName}</MenuItem>))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog} variant="outlined">Hủy</Button>
          <Button onClick={handleSaveAssignment} variant="contained" disabled={saving}>{saving ? <CircularProgress size={24}/> : 'Lưu'}</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog tạo/sửa kỹ năng */}
      <Dialog open={openSkillDialog} onClose={handleCloseSkillDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{skillDialogType === 'add' ? 'Tạo Kỹ Năng Mới' : 'Sửa Kỹ Năng'}<IconButton onClick={handleCloseSkillDialog} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseOutlined /></IconButton></DialogTitle>
        <DialogContent>
            <TextField autoFocus margin="dense" label="Tên Kỹ Năng" type="text" fullWidth value={currentSkill.skillName} onChange={(e) => setCurrentSkill({...currentSkill, skillName: e.target.value})} sx={{ mt: 1 }}/>
            <TextField margin="dense" label="Mô tả" type="text" fullWidth multiline rows={3} value={currentSkill.description} onChange={(e) => setCurrentSkill({...currentSkill, description: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSkillDialog} variant="outlined">Hủy</Button>
          <Button onClick={handleSaveSkill} variant="contained" disabled={isProcessingSkill}>{isProcessingSkill ? <CircularProgress size={24}/> : 'Lưu'}</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="top-right" autoClose={2000} />
    </MainCard>
  );
};

export default SkillManagement;