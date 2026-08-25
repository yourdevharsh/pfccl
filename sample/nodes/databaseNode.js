// databaseNode.js
import { baseNode } from "./baseNode";

const databaseConfig = {
  title: "Database Connector",
  description: "Fetches structured dataset entries.",
  inputs: [
    {
      label: "Resource Connection",
      type: "dropdown",
      options: ["PostgreSQL", "MongoDB", "MySQL"],
    },
    {
      label: "Query Filter String",
      type: "text",
      defaultValue: "SELECT * FROM users;",
    },
  ],
  handles: {
    left: [{ type: "target", id: "trigger" }],
    right: [{ type: "source", id: "queryResult" }],
  },
};

export const DatabaseNode = baseNode(databaseConfig);
