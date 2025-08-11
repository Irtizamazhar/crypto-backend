const nodemailer = require('nodemailer');

// Function to send welcome email to the user (uses ADMIN_EMAIL)
function sendMailtoUser(username, email) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
      family: 4,
    },
  });

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: email,
    subject: 'Welcome to Our Service',
    text: `Hello ${username},\n\nThank you for signing up for our service! We are glad to have you on board.\n\nBest regards,\nQuantumStack Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending welcome email:', error);
      return;
    }
    console.log('Welcome email sent:', info.response);
  });
}

// Function to send general contact emails (uses ADMIN_EMAIL)
const sendEmailToContact = async (toEmail, subject, text, file = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        family: 4,
      },
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: toEmail,
      subject,
      text,
      attachments: file
        ? [{
            filename: file.originalname,
            content: file.buffer,
          }]
        : [],
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    return { success: false, message: "Error sending email: " + error.message };
  }
};

// Function to send password reset links (uses ADMIN_EMAIL)
const sendMailtoPasswordReset = async (token, email) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        family: 4,
      },
    });

    const resetLink = `https://serenabeds.com/reset-password?token=${encodeURIComponent(token)}`;

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: "Password Reset Request",
      text: `Hello,\n\nReset your password here: ${resetLink}\n\nLink expires in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Password reset email sent successfully" };
  } catch (error) {
    return { success: false, message: "Error sending password reset email: " + error.message };
  }
};

// Function to send order confirmation (uses SALES_EMAIL)
const sendOrderConfirmationEmail = async (email, orders) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SALES_EMAIL,
        pass: process.env.SALES_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        family: 4,
      },
    });

    const totalPrice = orders.reduce((sum, order) => sum + order.newOrder.price, 0);

    const orderDetailsHtml = orders.map(({ newOrder, product, fabric, fabricColor }) => `
      <tr style="color: #1e293b;">
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${product.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${fabric.fabric_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${fabricColor.color_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">${newOrder.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">£${newOrder.price.toFixed(2)}</td>
      </tr>
    `).join("");

    const currentYear = new Date().getFullYear();
    const shippingAddress = orders[0].newOrder.shipping_address || "Not provided";

    const mailOptions = {
      from: process.env.SALES_EMAIL,
      to: email,
      subject: "🎉 Your Order Confirmation",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #f5f5f5; }
            .email-container { max-width: 650px; margin: auto; background: white; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .content { padding: 25px; line-height: 1.6; }
            .table-container { width: 100%; overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
            th { background: rgb(19,35,69); color: white; }
            .total-row { background: #eeeeee; font-weight: bold; }
            .footer { background: rgb(56,88,107); color: #fff; padding: 20px; text-align: center; font-size: 14px; }
            .footer img { max-width: 150px; height: auto; margin-bottom: 10px; }
            @media screen and (max-width: 600px) {
              .content, .footer { padding: 15px; }
              th, td { padding: 8px; }
              .table-container { overflow-x: scroll; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="content">
              <p style="font-size: 16px;">Dear Customer,</p>
              <p>We appreciate your purchase! Here are your order details:</p>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Fabric</th>
                      <th>Fabric Color</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderDetailsHtml}
                    <tr class="total-row">
                      <td colspan="4" style="text-align: right;">Total Amount:</td>
                      <td style="text-align: right;">£${totalPrice.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style="margin-top: 20px; font-weight: bold;">Shipping Address:</p>
              <p style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${shippingAddress}</p>
              <p>We will notify you once your order is shipped.</p>
              <p>Thank you for choosing <strong>Serena Beds</strong>!</p>
            </div>
            <div class="footer">
              <img src="https://serenabeds.ie/wp-content/uploads/2022/03/Serena_-_Logo_05_just_3_CMYK-01-removebg-preview.png" alt="Serena Beds">
              <p style="font-size:16px; font-weight:bold;">Serena Beds Ltd</p>
              <p>Unit 2 Ashbourne Business Center, Ashbourne, Co Meath</p>
              <p>Email: <a href="mailto:info@serenabeds.ie" style="color:#4CAF50; text-decoration:none;">info@serenabeds.ie</a> | Phone: <a href="tel:+353857358889" style="color:#4CAF50; text-decoration:none;">+353 85 735 8889</a></p>
              <p style="margin-top:10px;">&copy; ${currentYear} Serena Beds. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
  }
};

// Function to send order scheduled notification (uses SALES_EMAIL)
const sendOrderScheduleEmail = async (userEmail, userName, scheduleDate, orderId) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SALES_EMAIL,
        pass: process.env.SALES_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        family: 4,
      },
    });

    const mailOptions = {
      from: process.env.SALES_EMAIL,
      to: userEmail,
      subject: `📦 Your Order #${orderId} is Scheduled!`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:20px;border:1px solid #eee;">
          <h2 style="color:#1e293b;">Hi ${userName || "Customer"},</h2>
          <p>Your order <strong>#${orderId}</strong> has been successfully scheduled for delivery.</p>
          <p><strong>Scheduled Delivery Date:</strong> ${new Date(scheduleDate).toDateString()}</p>
          <p>We will notify you once it's out for delivery. Thank you for choosing <strong>Serena Beds</strong>.</p>
          <br/>
          <p style="color:#666;">Need help? Contact us at <a href="mailto:admin@serenabeds.ie">admin@serenabeds.ie</a></p>
          <hr style="margin-top:30px;"/>
          <footer style="font-size:14px;color:#888;text-align:center;">
            &copy; ${new Date().getFullYear()} Serena Beds Ltd. All rights reserved.
          </footer>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending schedule email:", error);
  }
};

module.exports = {
  sendMailtoUser,
  sendEmailToContact,
  sendMailtoPasswordReset,
  sendOrderConfirmationEmail,
  sendOrderScheduleEmail,
};
