// notificationNode.js
import { baseNode } from "./baseNode";

const notificationConfig = {
  title: "Notification Hub",
  description: "Dispatches updates across communication matrices.",
  inputs: [
    {
      label: "Channel Broadcast",
      type: "dropdown",
      options: [
        "Slack Webhook",
        "Discord Integration",
        "Twilio SMS",
        "SendGrid Email",
      ],
    },
    {
      label: "Urgent Pager Alert Priority",
      type: "checkbox",
      options: ["High Priority Override"],
    },
  ],
  handles: {
    left: [{ type: "target", id: "notificationBodyText" }],
    right: [{ type: "source", id: "dispatchReceipt" }],
  },
};

export const NotificationNode = baseNode(notificationConfig);
