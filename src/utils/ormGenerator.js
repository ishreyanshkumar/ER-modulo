/**
 * Utility to generate ORM models from the internal ER schema
 */

export const generatePrisma = (nodes, edges) => {
  let output =
    'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n';

  nodes
    .filter((n) => n.shape === "rectangle")
    .forEach((node) => {
      output += `model ${node.name} {\n`;
      node.attributes?.forEach((attr) => {
        let type = "String";
        if (attr.type === "INT") type = "Int";
        else if (attr.type === "BOOLEAN") type = "Boolean";
        else if (attr.type === "DATE" || attr.type === "TIMESTAMP")
          type = "DateTime";
        else if (attr.type.includes("DECIMAL")) type = "Float";

        let modifiers = "";
        if (attr.isPK) modifiers += " @id @default(autoincrement())";
        if (!attr.isNullable)
          modifiers += ""; // Prisma attributes are required by default
        else if (!attr.isPK) type += "?";

        output += `  ${attr.name} ${type}${modifiers}\n`;
      });

      // Handle Relations (simplified)
      const outgoing = edges.filter((e) => e.source === node.id);
      outgoing.forEach((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode) {
          output += `  ${targetNode.name.toLowerCase()} ${targetNode.name} @relation(fields: [${node.attributes?.find((a) => a.isFK)?.name || "refId"}], references: [id])\n`;
        }
      });

      output += "}\n\n";
    });

  return output;
};

export const generateSequelize = (nodes, edges) => {
  let output =
    'const { DataTypes } = require("sequelize");\nconst sequelize = require("./config/database");\n\n';

  nodes
    .filter((n) => n.shape === "rectangle")
    .forEach((node) => {
      output += `const ${node.name} = sequelize.define("${node.name}", {\n`;
      node.attributes?.forEach((attr) => {
        let type = "DataTypes.STRING";
        if (attr.type === "INT") type = "DataTypes.INTEGER";
        else if (attr.type === "BOOLEAN") type = "DataTypes.BOOLEAN";
        else if (attr.type === "DATE" || attr.type === "TIMESTAMP")
          type = "DataTypes.DATE";
        else if (attr.type.includes("DECIMAL")) type = "DataTypes.DECIMAL";

        output += `  ${attr.name}: {\n`;
        output += `    type: ${type},\n`;
        if (attr.isPK)
          output += "    primaryKey: true,\n    autoIncrement: true,\n";
        output += `    allowNull: ${attr.isNullable}\n`;
        output += "  },\n";
      });
      output += "});\n\n";
    });

  return output;
};

export const generateSQLAlchemy = (nodes, edges) => {
  let output =
    "from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric\nfrom sqlalchemy.ext.declarative import declarative_base\nfrom sqlalchemy.orm import relationship\n\nBase = declarative_base()\n\n";

  nodes
    .filter((n) => n.shape === "rectangle")
    .forEach((node) => {
      output += `class ${node.name}(Base):\n`;
      output += `    __tablename__ = "${node.name.toLowerCase()}"\n\n`;
      node.attributes?.forEach((attr) => {
        let type = "String(255)";
        if (attr.type === "INT") type = "Integer";
        else if (attr.type === "BOOLEAN") type = "Boolean";
        else if (attr.type === "DATE" || attr.type === "TIMESTAMP")
          type = "DateTime";
        else if (attr.type.includes("DECIMAL")) type = "Numeric";

        let params = [];
        if (attr.isPK) params.push("primary_key=True");
        if (!attr.isNullable) params.push("nullable=False");

        output += `    ${attr.name} = Column(${type}${params.length ? ", " + params.join(", ") : ""})\n`;
      });
      output += "\n";
    });

  return output;
};
