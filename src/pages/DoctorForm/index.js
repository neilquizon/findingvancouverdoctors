import { Col, Form, message, Row } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AddDoctor,
  CheckIfDoctorAccountIsApplied,
  UpdateDoctor,
} from "../../apicalls/doctors";
import { ShowLoader } from "../../redux/loaderSlice";

const DoctorForm = () => {
  const [form] = Form.useForm();
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  const [days, setDays] = useState([]);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoader(true));
      const payload = {
        ...values,
        days,
        userId: JSON.parse(localStorage.getItem("user")).id,
        status: "pending",
        role: "doctor",
      };
      let response = null;
      if (alreadyApproved) {
        payload.id = JSON.parse(localStorage.getItem("user")).id;
        payload.status = "approved";
        response = await UpdateDoctor(payload);
      } else {
        response = await AddDoctor(payload);
      }

      if (response.success) {
        message.success(response.message);
        navigate("/profile");
      } else {
        message.error(response.message);
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const checkIfAlreadyApplied = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await CheckIfDoctorAccountIsApplied(
        JSON.parse(localStorage.getItem("user")).id
      );
      if (response.success) {
        setAlreadyApplied(true);
        if (response.data.status === "approved") {
          setAlreadyApproved(true);
          form.setFieldsValue(response.data);
          setDays(response.data.days);
        }
      } else {
        setAlreadyApplied(false);
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    checkIfAlreadyApplied();
  }, []);

  return (
    <div className="bg-white p-2">
      {(!alreadyApplied || alreadyApproved) && (
        <>
          <h3 className="uppercase my-1">
            {alreadyApproved ? "Update your information" : "Apply as a doctor"}
          </h3>
          <hr />
          <Form layout="vertical" className="my-1" onFinish={onFinish} form={form}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <h4 className="uppercase">
                  <b>Personal Information</b>
                </h4>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="text" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="text" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="email" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Medical Services Plan (MSP)"
                  name="msp"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="number" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="number" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Website"
                  name="website"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="text" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <textarea type="text" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <hr />
              </Col>
              <Col span={24}>
                <h4 className="uppercase">
                  <b>Professional Information</b>
                </h4>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Speciality"
                  name="speciality"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <select>
                    <option value="dermatologist">Dermatologist</option>
                    <option value="cardiologist">Cardiologist</option>
                    <option value="gynecologist">Gynecologist</option>
                    <option value="neurologist">Neurologist</option>
                    <option value="orthopedic">Orthopedic</option>
                    <option value="pediatrician">Pediatrician</option>
                    <option value="psychiatrist">Psychiatrist</option>
                    <option value="surgeon">Surgeon</option>
                    <option value="urologist">Urologist</option>
                  </select>
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Experience"
                  name="experience"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="number" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Language"
                  name="language"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="text" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <hr />
              </Col>
              <Col span={24}>
                <h4 className="uppercase">
                  <b>Work Hours</b>
                </h4>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="Start Time"
                  name="startTime"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="time" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  label="End Time"
                  name="endTime"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <input type="time" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Row gutter={[8, 8]}>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => (
                    <Col span={12} key={index} className="flex items-center">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={days.includes(day)}
                          value={day}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDays([...days, e.target.value]);
                            } else {
                              setDays(days.filter((item) => item !== e.target.value));
                            }
                          }}
                        />
                        <label className="ml-1" style={{ marginLeft: '8px' }}>{day}</label>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
            <div className="flex justify-end gap-2">
              <button className="outlined-btn" type="button">
                CANCEL
              </button>
              <button className="contained-btn" type="submit">
                SUBMIT
              </button>
            </div>
          </Form>
        </>
      )}
      {alreadyApplied && !alreadyApproved && (
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-secondary">
            You have already applied for this doctor account, please wait for the admin to approve your request
          </h3>
        </div>
      )}
    </div>
  );
};

export default DoctorForm;
