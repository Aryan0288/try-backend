
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: "learninggate288@gmail.com",
        pass: "gfjediqehwoxjqob",
    },
});


const sendmail = async (to, subject, msg) => {
    try {
        await transporter.sendMail({
            from: 'One time password OTP for account registration(CHATHUB)',
            to: to,
            subject: subject,
            text: 'verification email',
            html: `<h1>EMAIL OTP : ${msg} </h1>`
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


module.exports = sendmail;