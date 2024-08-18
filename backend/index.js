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

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
