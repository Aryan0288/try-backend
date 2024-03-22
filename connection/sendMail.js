
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
            from: 'twiter verification message',
            to: to,
            subject: subject,
            text: 'verification email',
            html: `<h1 style=\"background-color:yellow; font-size:25px"\>${msg}
                    click below to verify your email </h1>
                    <a href=\"http://localhost:8080/verifyemail?email=${to}"\>click here</a>
                    `
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


module.exports = sendmail;