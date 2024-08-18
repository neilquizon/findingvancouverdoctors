const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'findingvancouverdoctor@gmail.com',
    pass: 'stfc wmls nezq mhpp',
  },
});

// Function to handle appointment cancellation
const cancelAppointment = (appointmentId, doctorEmail, userEmail, cancelledBy) => {
  const subject = `Appointment Cancelled`;
  const text = `The appointment with ID ${appointmentId} has been cancelled by ${cancelledBy}.`;

  // Send email to both doctor and user
  const emails = [doctorEmail, userEmail];
  emails.forEach((email) => {
    if (email) {  // Ensure the email is not blank or undefined
      const mailOptions = {
        from: 'findingvancouverdoctor@gmail.com',
        to: email,
        subject,
        text,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(`Failed to send email to ${email}: `, error);
        } else {
          console.log(`Email sent to ${email}: `, info.response);
        }
      });
    } else {
      console.log(`No email address provided for ${cancelledBy}`);
    }
  });

  // Here you would typically also update the appointment status in your database
};

app.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: 'findingvancouverdoctor@gmail.com',
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send({ success: false, error });
    } else {
      console.log('Email sent: ' + info.response);
      return res.send({ success: true });
    }
  });
});

app.post('/cancel-appointment', (req, res) => {
  const { appointmentId, doctorEmail, userEmail, cancelledBy } = req.body;

  // Call the cancelAppointment function
  cancelAppointment(appointmentId, doctorEmail, userEmail, cancelledBy);

  // Send response back to client
  return res.send({ success: true, message: 'Appointment cancelled and emails sent.' });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
