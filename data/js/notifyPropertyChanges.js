require("dotenv").config();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } =
  process.env;
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !NOTIFY_EMAIL) {
  console.error("SMTP and notification email settings must be defined in .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Define property schema (minimal for change watching)
const propertySchema = new mongoose.Schema({}, { strict: false });
const Property = mongoose.model("Property", propertySchema, "properties");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not defined in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB, starting change stream...");
    watchChanges();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  });

function watchChanges() {
  const changeStream = Property.watch();
  changeStream.on("change", (change) => {
    console.log("Detected change:", change);
    sendNotification(change);
  });
}

function sendNotification(change) {
  const mailOptions = {
    from: SMTP_USER,
    to: NOTIFY_EMAIL,
    subject: "Property Update Detected",
    text: `A change was detected in the properties collection:\n\n${JSON.stringify(change, null, 2)}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Error sending notification email:", err);
    } else {
      console.log("Notification email sent:", info.response);
    }
  });
}
