import React, { useState, useEffect } from "react";
import { Tabs, Form, Input, Button } from "antd";
import Appointments from "./Appointments";
import DoctorForm from "../DoctorForm";
import moment from "moment";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    form.setFieldsValue(storedUser);
  }, [form]);

  const handleSave = (values) => {
    // Update user information in local storage
    const updatedUser = { ...user, ...values };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    form.setFieldsValue(user);
    setIsEditing(false);
  };

  const buttonStyle = {
    backgroundColor: '#0073b1',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
    marginTop: '10px',
  };

  const buttonHoverStyle = {
    backgroundColor: '#005f8d'
  };

  return (
    <div>
      <Tabs>
        <Tabs.TabPane tab="Appointments" key="1">
          <Appointments />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Profile" key="2">
          {user.role === "doctor" && <DoctorForm />}

          {user.role !== "doctor" && (
            <div className="my-1 bg-white p-1 flex flex-col gap-1">
              {isEditing ? (
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={user}
                  onFinish={handleSave}
                >
                  <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input your name!' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Date of Birth" name="dob" rules={[{ required: true, message: 'Please input your date of birth!' }]}>
                    <Input type="date" />
                  </Form.Item>
                  <Form.Item label="Provincial Health Number" name="provincialHealthNumber" rules={[{ required: true, message: 'Please input your Provincial Health Number!' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Please input your address!' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Telephone Number" name="telephoneNumber" rules={[{ required: true, message: 'Please input your Telephone Number!' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please input your email!', type: 'email' }]}>
                    <Input />
                  </Form.Item>

                  <div className="flex gap-2">
                    <button 
                      className="contained-btn my-1 w-full" 
                      type="submit" 
                      style={buttonStyle} 
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor} 
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                    >
                      Save
                    </button>
                    <button 
                      className="contained-btn my-1 w-full" 
                      onClick={handleCancel} 
                      style={buttonStyle} 
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor} 
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              ) : (
                <>
                  <div className="flex gap-2">
                    <h4>
                      <b>Name : {user.name}</b>
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <h4>
                      <b>Date of Birth : {moment(user.dob).format("DD-MM-YYYY")}</b>
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <h4>
                      <b>Provincial Health Number : {user.provincialHealthNumber}</b>
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <h4>
                      <b>Address : {user.address}</b>
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <h4>
                      <b>Telephone Number : {user.telephoneNumber}</b>
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <h4>
                      <b>Email : {user.email}</b>
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <h4>
                      <b>
                        Created On : {moment(user?.createdAt).format("DD-MM-YYYY hh:mm A")}
                      </b>
                    </h4>
                  </div>
                  <button 
                    className="contained-btn my-1 w-full" 
                    onClick={() => setIsEditing(true)} 
                    style={buttonStyle} 
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor} 
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Profile;
