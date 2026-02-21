import { Parser } from "sql-ddl-to-json-schema";

/**
 * Resolves $ref pointers within the same table schema Definitions
 */
const resolveRef = (table, ref) => {
  if (!ref || !ref.startsWith("#/definitions/")) return null;
  const key = ref.replace("#/definitions/", "");
  return table.definitions?.[key];
};

/**
 * Maps JSON Schema types to SQL types used in the app
 */
const mapType = (meta) => {
  if (!meta) return "VARCHAR(255)";

  if (meta.type === "integer") return "INT";
  if (meta.type === "number") return "DECIMAL(10,2)";
  if (meta.type === "boolean") return "BOOLEAN";

  if (meta.type === "string") {
    if (meta.format === "date-time" || meta.format === "datetime")
      return "TIMESTAMP";
    if (meta.format === "date") return "DATE";
    if (meta.maxLength > 500) return "TEXT";
    return `VARCHAR(${meta.maxLength || 255})`;
  }

  // Try to check for common SQL keywords if original type info is available
  if (
    meta.$comment &&
    (meta.$comment.toLowerCase().includes("timestamp") ||
      meta.$comment.toLowerCase().includes("datetime"))
  )
    return "TIMESTAMP";
  if (meta.$comment && meta.$comment.toLowerCase().includes("text"))
    return "TEXT";

  return "VARCHAR(255)";
};

export const sqlToER = (sql, dialect = "postgresql") => {
  // Map UI dialect names to parser supported strings.
  // Using 'mysql' as a robust base for basic DDL across dialects.
  const dialectMap = {
    postgresql: "mysql",
    mysql: "mysql",
    sqlite: "mysql",
    oracle: "mysql",
  };

  const parser = new Parser(dialectMap[dialect] || "mysql");

  try {
    const jsonSchema = parser.feed(sql).toJsonSchemaArray();
    const nodes = [];
    const rawEdges = [];

    jsonSchema.forEach((table, index) => {
      const tableId = `node_${Date.now()}_${index}`;
      const tableName = table.title || `table_${index}`;

      const attributes = Object.entries(table.properties || {}).map(
        ([colName, colMeta]) => {
          const meta = colMeta.$ref
            ? resolveRef(table, colMeta.$ref) || colMeta
            : colMeta;

          return {
            id: `attr_${Date.now()}_${Math.random()}`,
            name: colName,
            type: mapType(meta),
            isPK: !!meta.primaryKey,
            isFK: !!meta.foreignKey,
            isNullable: !table.required?.includes(colName),
            indent: 0,
          };
        },
      );

      nodes.push({
        id: tableId,
        shape: "rectangle",
        name: tableName,
        x: 100 + index * 250,
        y: 100 + index * 50,
        isWeak: false,
        color: "bg-[#bae6fd]",
        attributes,
      });

      // Pass 1: Extract foreign keys with table names
      Object.entries(table.properties || {}).forEach(([colName, colMeta]) => {
        const meta = colMeta.$ref
          ? resolveRef(table, colMeta.$ref) || colMeta
          : colMeta;
        if (meta.foreignKey && meta.foreignKey.references) {
          rawEdges.push({
            sourceName: tableName,
            targetName: meta.foreignKey.references.table,
          });
        }
      });
    });

    // Pass 2: Resolve table names to node IDs
    const finalEdges = rawEdges
      .map((re) => {
        const source = nodes.find(
          (n) => n.name.toLowerCase() === re.sourceName.toLowerCase(),
        );
        const target = nodes.find(
          (n) => n.name.toLowerCase() === re.targetName.toLowerCase(),
        );
        if (source && target) {
          return {
            id: `edge_${Date.now()}_${Math.random()}`,
            source: source.id,
            target: target.id,
            cardinality: "N",
            participation: "partial",
          };
        }
        return null;
      })
      .filter((e) => e !== null);

    return { nodes, edges: finalEdges };
  } catch (err) {
    console.error("SQL Parsing failed:", err);
    throw new Error(
      "Failed to parse SQL DDL. Ensure you are using standard CREATE TABLE syntax.",
    );
  }
};
