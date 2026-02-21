export const buildSchema = (nodes, edges, method = "method1") => {
  let rels = new Map();

  nodes
    .filter((n) => n.shape === "rectangle")
    .forEach((ent) => {
      let cols = [];
      let multiValued = [];

      ent.attributes?.forEach((attr, i, arr) => {
        if (attr.isDerived) return;
        const indent = attr.indent || 0;
        const isParent = arr[i + 1] && (arr[i + 1].indent || 0) > indent;
        if (isParent) return;

        let fullName = attr.name;
        if (indent > 0) {
          let prefix = "";
          let curr = indent;
          for (let j = i - 1; j >= 0; j--) {
            if ((arr[j].indent || 0) < curr) {
              prefix = arr[j].name + "_" + prefix;
              curr = arr[j].indent || 0;
            }
            if (curr === 0) break;
          }
          fullName = prefix + attr.name;
        }

        const colDef = {
          name: fullName,
          type: attr.type,
          isPK: attr.isPK,
          isNullable: attr.isNullable,
          isPartialKey: attr.isPartialKey,
        };
        if (attr.isMultivalued) multiValued.push(colDef);
        else cols.push(colDef);
      });
      rels.set(ent.id, {
        id: ent.id,
        name: ent.name,
        columns: cols,
        multiValued,
        isWeak: ent.isWeak,
      });
    });

  const getEntityPKs = (entId) => {
    const r = rels.get(entId);
    if (!r) return [];
    return r.columns
      .filter((c) => c.isPK || c.isPartialKey)
      .map((c) => ({ ...c, refTable: r.name, refCol: c.name }));
  };

  nodes
    .filter((n) => n.shape === "diamond" && n.isWeak)
    .forEach((dia) => {
      const diaEdges = edges.filter(
        (e) => e.source === dia.id || e.target === dia.id,
      );
      const weakEdge = diaEdges.find(
        (e) =>
          nodes.find(
            (n) => n.id === (e.source === dia.id ? e.target : e.source),
          )?.isWeak,
      );
      const strongEdge = diaEdges.find((e) => e !== weakEdge);

      if (weakEdge && strongEdge) {
        const weakId =
          weakEdge.source === dia.id ? weakEdge.target : weakEdge.source;
        const strongId =
          strongEdge.source === dia.id ? strongEdge.target : strongEdge.source;

        const strongPKs = getEntityPKs(strongId);
        const weakRel = rels.get(weakId);
        if (weakRel) {
          strongPKs.forEach((pk) => {
            weakRel.columns.unshift({
              name: `${pk.refTable}_${pk.name}`,
              type: pk.type,
              isPK: true,
              isFK: true,
              refTable: pk.refTable,
              refCol: pk.refCol,
            });
          });
          weakRel.columns.forEach((c) => {
            if (c.isPartialKey) {
              c.isPK = true;
              c.isPartialKey = false;
            }
          });
        }
      }
      dia._processed = true;
    });

  nodes
    .filter((n) => n.shape === "isa")
    .forEach((isa) => {
      const parentRel = rels.get(isa.parentId);
      if (!parentRel) return;
      const childIds = edges
        .filter((e) => e.source === isa.id || e.target === isa.id)
        .map((e) => (e.source === isa.id ? e.target : e.source))
        .filter((id) => id !== isa.parentId);

      if (method === "method1") {
        const parentPKs = getEntityPKs(isa.parentId);
        childIds.forEach((cId) => {
          const cRel = rels.get(cId);
          if (cRel) {
            parentPKs.forEach((pk) =>
              cRel.columns.unshift({
                name: pk.name,
                type: pk.type,
                isPK: true,
                isFK: true,
                refTable: parentRel.name,
                refCol: pk.name,
              }),
            );
          }
        });
      } else if (method === "method2") {
        childIds.forEach((cId) => {
          const cRel = rels.get(cId);
          if (cRel) cRel.columns = [...parentRel.columns, ...cRel.columns];
        });
        parentRel._deleted = true;
      }
    });

  const getIdentifier = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return [];
    if (node.shape === "rectangle") return getEntityPKs(node.id);
    if (node.shape === "aggregation") return getIdentifier(node.relId);
    if (node.shape === "diamond") {
      const connEdges = edges.filter(
        (e) => e.source === node.id || e.target === node.id,
      );
      let pks = [];
      connEdges.forEach((e) => {
        const otherId = e.source === node.id ? e.target : e.source;
        const otherNode = nodes.find((n) => n.id === otherId);
        if (
          otherNode &&
          (otherNode.shape === "rectangle" || otherNode.shape === "aggregation")
        ) {
          pks.push(...getIdentifier(otherId));
        }
      });
      return pks;
    }
    return [];
  };

  let junctionTables = [];
  nodes
    .filter((n) => n.shape === "diamond" && !n._processed)
    .forEach((dia) => {
      const diaEdges = edges.filter(
        (e) => e.source === dia.id || e.target === dia.id,
      );
      const connections = diaEdges
        .map((edge) => {
          const otherId = edge.source === dia.id ? edge.target : edge.source;
          const otherNode = nodes.find((n) => n.id === otherId);
          if (
            otherNode &&
            (otherNode.shape === "rectangle" ||
              otherNode.shape === "aggregation")
          ) {
            return { node: otherNode, edge, pks: getIdentifier(otherId) };
          }
          return null;
        })
        .filter(Boolean);

      if (connections.length >= 2) {
        const isMN =
          connections.every(
            (c) => c.edge.cardinality === "N" || c.edge.cardinality === "M",
          ) || connections.length > 2;
        const hasAgg = connections.some((c) => c.node.shape === "aggregation");

        if (isMN || hasAgg) {
          let cols = [];
          connections.forEach((c) => {
            c.pks.forEach((pk) => {
              cols.push({
                name: `${c.node.name}_${pk.name}`,
                type: pk.type,
                isPK: true,
                isFK: true,
                refTable: pk.refTable,
                refCol: pk.refCol,
              });
            });
          });
          edges
            .filter((e) => e.source === dia.id || e.target === dia.id)
            .forEach((e) => {
              const otherId = e.source === dia.id ? e.target : e.source;
              const otherNode = nodes.find((n) => n.id === otherId);
              if (otherNode && otherNode.shape === "attribute")
                cols.push({
                  name: otherNode.name,
                  type: "VARCHAR(255)",
                  isNullable: true,
                });
            });
          junctionTables.push({
            name: dia.name,
            columns: cols,
            isJunction: true,
          });
        } else {
          let oneSide, nSide;
          if (
            connections.some((c) => c.edge.cardinality === "1") &&
            connections.some((c) => c.edge.cardinality === "N")
          ) {
            oneSide = connections.find((c) => c.edge.cardinality === "1");
            nSide = connections.find((c) => c.edge.cardinality === "N");
          } else if (connections.every((c) => c.edge.cardinality === "1")) {
            nSide =
              connections.find((c) => c.edge.participation === "total") ||
              connections[0];
            oneSide = connections.find((c) => c !== nSide);
          }

          if (oneSide && nSide && nSide.node.shape === "rectangle") {
            const nRel = rels.get(nSide.node.id);
            if (nRel) {
              oneSide.pks.forEach((pk) => {
                nRel.columns.push({
                  name: `${oneSide.node.name}_${pk.name}`,
                  type: pk.type,
                  isFK: true,
                  refTable: pk.refTable,
                  refCol: pk.refCol,
                  isNullable: nSide.edge.participation !== "total",
                });
              });
            }
          }
        }
      }
    });

  let multiTables = [];
  Array.from(rels.values()).forEach((rel) => {
    if (rel._deleted) return;
    rel.multiValued.forEach((mv) => {
      let cols = getEntityPKs(rel.id).map((pk) => ({
        name: `${pk.refTable}_${pk.name}`,
        type: pk.type,
        isPK: true,
        isFK: true,
        refTable: pk.refTable,
        refCol: pk.refCol,
      }));
      cols.push({ name: mv.name, type: mv.type, isPK: true });
      multiTables.push({
        name: `${rel.name}_${mv.name}`,
        columns: cols,
        isJunction: true,
      });
    });
  });

  return {
    entities: Array.from(rels.values()).filter((r) => !r._deleted),
    junctions: [...junctionTables, ...multiTables],
  };
};

export const buildSQLText = (schema, dialect = "postgresql") => {
  let sql = `-- COMPILED SQL DDL (${dialect.toUpperCase()})\n-- Supports ISA, Weak Entities, Multivalued, Composite, and Aggregation.\n\n`;
  const allTables = [...schema.entities, ...schema.junctions];

  const typeMap = {
    postgresql: {
      INT: "INT",
      "VARCHAR(255)": "VARCHAR(255)",
      SERIAL: "SERIAL",
    },
    mysql: {
      INT: "INT",
      "VARCHAR(255)": "VARCHAR(255)",
      SERIAL: "INT AUTO_INCREMENT",
    },
    oracle: {
      INT: "NUMBER(10)",
      "VARCHAR(255)": "VARCHAR2(255)",
      SERIAL: "NUMBER GENERATED BY DEFAULT AS IDENTITY",
    },
    sqlite: { INT: "INTEGER", "VARCHAR(255)": "TEXT", SERIAL: "INTEGER" },
  };

  const quote = (str) => (dialect === "mysql" ? `\`${str}\`` : `"${str}"`);

  allTables.forEach((t) => {
    sql += `CREATE TABLE ${quote(t.name)} (\n`;
    let colDefs = [];
    let pks = [];
    let fks = [];

    t.columns.forEach((c) => {
      let type = c.type;

      // Auto-increment / Serial handling
      if (c.isPK && c.type === "INT") {
        type = typeMap[dialect]["SERIAL"] || "INT";
      } else {
        type = typeMap[dialect][c.type] || c.type;
      }

      let def = `  ${quote(c.name)} ${type}`;

      if (dialect === "sqlite" && c.isPK && type === "INTEGER") {
        // SQLite special case for autoincrement
        // Don't add NOT NULL here, handled by PK
      } else if (!c.isNullable && !c.isPK) {
        def += ` NOT NULL`;
      }

      colDefs.push(def);
      if (c.isPK) pks.push(quote(c.name));
      if (c.isFK)
        fks.push(
          `  FOREIGN KEY (${quote(c.name)}) REFERENCES ${quote(c.refTable)}(${quote(c.refCol)}) ON DELETE CASCADE`,
        );
    });

    if (pks.length > 0) {
      if (
        dialect === "sqlite" &&
        pks.length === 1 &&
        t.columns.find((c) => c.name === pks[0] && c.type === "INT")
      ) {
        // Handled in col definition for SQLite
      } else {
        colDefs.push(`  PRIMARY KEY (${pks.join(", ")})`);
      }
    }
    fks.forEach((fk) => colDefs.push(fk));
    sql += colDefs.join(",\n") + `\n);\n\n`;
  });
  return sql;
};

export const buildRelationalText = (schema) => {
  let text = "RELATIONAL SCHEMA (Textbook Format):\n\n";
  const allTables = [...schema.entities, ...schema.junctions];
  allTables.forEach((t) => {
    let cols = t.columns.map((c) => {
      let s = c.name;
      if (c.isPK) s = `[PK] ${s}`;
      if (c.isFK) s = `${s} (FK -> ${c.refTable}.${c.refCol})`;
      return s;
    });
    text += `${t.name} ( ${cols.join(", ")} )\n`;
  });
  return text;
};

export const renderHighlightedSQL = (text) => {
  const html = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>')
    .replace(/(--.*)/g, '<span class="text-neutral-500 italic">$1</span>')
    .replace(
      /\b(CREATE TABLE|PRIMARY KEY|FOREIGN KEY|REFERENCES|ON DELETE CASCADE|NOT NULL)\b/g,
      '<span class="text-pink-500 font-semibold">$1</span>',
    )
    .replace(
      /\b(INT|VARCHAR|DECIMAL|TEXT|BOOLEAN|DATE|TIMESTAMP)\b/g,
      '<span class="text-sky-500 font-semibold">$1</span>',
    );
  return { __html: html };
};

export const renderHighlightedSchema = (text) => {
  const html = text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /^(RELATIONAL SCHEMA.*)/g,
      '<span class="text-neutral-500 italic">$1</span>',
    )
    .replace(
      /^([A-Za-z0-9_]+)(\s*\()/gm,
      '<span class="text-sky-400 font-bold">$1</span>$2',
    )
    .replace(/\[PK\]/g, '<span class="text-amber-500 font-bold">[PK]</span>')
    .replace(
      /\(FK -> ([^)]+)\)/g,
      '<span class="text-emerald-500 font-bold">(FK -> <span class="text-emerald-300">$1</span>)</span>',
    );
  return { __html: html };
};
