import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Table, message, Modal } from 'antd';
import { ShowLoader } from '../../redux/loaderSlice';
import { GetAllUsers, DeleteUser } from '../../apicalls/users';
import './UsersList.css'; // Ensure you create this CSS file

function UsersList() {
  const [users, setUsers] = React.useState([]);
  const dispatch = useDispatch();

  const getData = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllUsers();
      dispatch(ShowLoader(false));
      if (response.success) {
        setUsers(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const confirmDelete = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      onOk: () => onDelete(id),
    });
  };

  const onDelete = async (id) => {
    try {
      dispatch(ShowLoader(true));
      const response = await DeleteUser(id);
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
        getData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        record.role !== 'admin' && (
          <span
            style={{ color: 'red', cursor: 'pointer' }}
            onClick={() => confirmDelete(record.id)}
          >
            Delete
          </span>
        )
      ),
    },
  ];

  return (
    <div className="table-container">
      <Table columns={columns} dataSource={users} pagination={false} rowKey="id" scroll={{ x: true }} />
    </div>
  );
}

export default UsersList;
