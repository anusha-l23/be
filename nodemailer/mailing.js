const nodemailer = require("nodemailer");

module.exports.sendingMail = async ({ from, to, subject, text, html }) => {
  try {
    let mailOptions = {
      from,
      to,
      subject,
      text,
      html,
    };

    const Transporter = nodemailer.createTransport({
      //host: 'smtp.ionos.com',
      //port:465,
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    return await Transporter.sendMail(mailOptions);
     
  } catch (error) {
    console.log(error);    
  }
};
