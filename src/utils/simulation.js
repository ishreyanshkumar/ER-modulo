import initSqlJs from "sql.js";

let db = null;

/**
 * Initializes the SQL.js database with the provided DDL script
 */
export const initSimulation = async (sqlScript) => {
  try {
    const SQL = await initSqlJs({
      // Explicitly point to the localized browser-optimized WASM file
      locateFile: (file) =>
        file.endsWith(".wasm") ? "/sql-wasm-browser.wasm" : file,
    });

    db = new SQL.Database();

    // Split the script into individual statements and execute
    // sql.js execute() can handle multiple statements if they are valid SQL
    db.run(sqlScript);

    return { success: true };
  } catch (error) {
    console.error("SQL.js initialization failed:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Runs a query against the current database
 */
export const runQuery = (query) => {
  if (!db) return { error: "Database not initialized" };

  try {
    const res = db.exec(query);
    if (res.length === 0) return { columns: [], values: [] };

    return {
      columns: res[0].columns,
      values: res[0].values,
    };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Resets the simulation
 */
export const resetSimulation = () => {
  if (db) {
    db.close();
    db = null;
  }
};
