const admin = require("../config/firebase-admin");

const notificationToTopic = async (topic, title, body) => {
    try {
        const message = {
            topic: topic,
            notification: {
                title: title,
                body: body,
            },
        };

        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
    } catch (error) {
        console.error("Error sending test notification:", error);
    }
};

module.exports = {
    notificationToTopic
};
