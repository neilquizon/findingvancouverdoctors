import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Table, message, Modal } from 'antd';
import { ShowLoader } from '../../redux/loaderSlice';
import { GetAllUsers, DeleteUser } from '../../apicalls/users';
import './UsersList.css'; // Ensure you create this CSS file

// Footer Component
const Footer = () => (
  <footer style={{ backgroundColor: '#004182', color: 'white', padding: '1rem', fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
    <p style={{ color: 'white' }}>&copy; 2024 Finding Vancouver Doctor. All rights reserved.</p>
  </footer>
);

function UsersList() {
  const [users, setUsers] = React.useState([]);
  const dispatch = useDispatch();

  const getData = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllUsers();
      dispatch(ShowLoader(false));
      if (response.success) {
        // Sort users by name in alphabetical order
        const sortedUsers = response.data.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setUsers(sortedUsers);
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
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
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
      <Footer /> {/* Insert the Footer component here */}
    </div>
  );
}

export default UsersList;
