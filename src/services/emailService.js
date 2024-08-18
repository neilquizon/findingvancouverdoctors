import axios from 'axios';

const sendEmail = async (to, subject, text) => {
  try {
    const response = await axios.post('http://localhost:5000/send-email', {
      to,
      subject,
      text,
    });
    if (response.data.success) {
      console.log('Email sent successfully');
    } else {
      console.log('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email', error);
  }
};

export default sendEmail;
