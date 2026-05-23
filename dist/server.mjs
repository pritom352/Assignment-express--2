

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
var config, config_default;
var init_config = __esm({
  "src/config/index.ts"() {
    "use strict";
    dotenv.config({
      path: path.join(process.cwd(), ".env")
    });
    config = {
      connectionString: process.env.CONNECTIONSTRING,
      jwtSecret: process.env.JWTSECRET
    };
    config_default = config;
  }
});

// src/db/index.ts
import { Pool } from "pg";
var pool, initDB;
var init_db = __esm({
  "src/db/index.ts"() {
    "use strict";
    init_config();
    pool = new Pool(
      {
        connectionString: config_default.connectionString
      }
    );
    initDB = async () => {
      try {
        await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        email VARCHAR(50) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
        );
            `);
        await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20)
NOT NULL
DEFAULT 'open'
CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INTEGER ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
       
        );
        `);
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };
  }
});

// src/utils/error.ts
var AppError, error_default;
var init_error = __esm({
  "src/utils/error.ts"() {
    "use strict";
    AppError = class extends Error {
      statusCode;
      constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
      }
    };
    error_default = AppError;
  }
});

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var jwtCode, createUser, loginUser, getAllUsers, authService;
var init_auth_service = __esm({
  "src/modules/auth/auth.service.ts"() {
    "use strict";
    init_db();
    init_error();
    init_config();
    jwtCode = config_default.jwtSecret;
    createUser = async (payload) => {
      const { name, email, password, role = "contributor" } = payload;
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);
      const checkemail = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
      if (checkemail.rows.length > 0) {
        throw new error_default(409, "Email already exists");
      }
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, email, hashPassword, role]
      );
      return result;
    };
    loginUser = async (email, password) => {
      const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
      if (result.rows.length === 0) {
        throw new error_default(404, "No user found with this email");
      }
      const user = result.rows[0];
      const matchPassword = await bcrypt.compare(password, user.password);
      if (!matchPassword) {
        throw new error_default(401, "Invalid password");
      }
      const jwtPayload = {
        id: user.id,
        name: user.name,
        role: user.role
      };
      const accessToken = jwt.sign(jwtPayload, jwtCode, { expiresIn: "10d" });
      return { accessToken, user };
    };
    getAllUsers = async () => {
      const result = await pool.query(`SELECT * FROM users`);
      return result;
    };
    authService = {
      createUser,
      loginUser,
      jwtCode,
      getAllUsers
    };
  }
});

// src/modules/auth/auth.controller.ts
var signup, login, allUsers, authController;
var init_auth_controller = __esm({
  "src/modules/auth/auth.controller.ts"() {
    "use strict";
    init_auth_service();
    signup = async (req, res) => {
      try {
        const result = await authService.createUser(req.body);
        const { password, ...userWithoutPassword } = result.rows[0];
        res.status(201).json({ success: true, message: "User created successfully", user: userWithoutPassword });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    login = async (req, res) => {
      try {
        const result = await authService.loginUser(req.body.email, req.body.password);
        console.log("Login result:", result);
        const { password, ...userWithoutPassword } = result.user;
        res.status(200).json({ success: true, message: "Login successful", data: { token: result.accessToken, userWithoutPassword } });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    allUsers = async (req, res) => {
      console.log("Request user:", req.user);
      try {
        const result = await authService.getAllUsers();
        res.status(200).json({ success: true, message: "User retrieved successfully", users: result.rows });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    authController = {
      signup,
      login,
      allUsers
    };
  }
});

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth, auth_default;
var init_auth = __esm({
  "src/middleware/auth.ts"() {
    "use strict";
    init_auth_service();
    init_db();
    auth = () => {
      return async (req, res, next) => {
        try {
          const authHeader = req.headers.authorization;
          if (!authHeader) {
            return res.status(401).json({ success: false, message: "Authorization header missing" });
          }
          const decodedToken = jwt2.verify(authHeader, authService.jwtCode);
          console.log("Decoded token:", decodedToken);
          const matchingUser = await pool.query(
            `SELECT * FROM users WHERE id = $1 AND name = $2`,
            [decodedToken.id, decodedToken.name]
          );
          if (matchingUser.rows.length === 0) {
            return res.status(401).json({ success: false, message: "User not foundbbbb" });
          }
          req.user = decodedToken;
          next();
        } catch (error) {
          res.status(401).json({ success: false, message: "Unauthorized access" });
          next(error);
        }
      };
    };
    auth_default = auth;
  }
});

// src/modules/auth/auth.route.ts
import { Router } from "express";
var router, authRouter;
var init_auth_route = __esm({
  "src/modules/auth/auth.route.ts"() {
    "use strict";
    init_auth_controller();
    init_auth();
    router = Router();
    router.post("/signup", authController.signup);
    router.get("/allusers", auth_default(), authController.allUsers);
    router.post("/login", authController.login);
    authRouter = router;
  }
});

// src/modules/issues/issues.service.ts
var createIssue, getAllIssues, getIssueById, updateIssue, deleteIssue, issueService;
var init_issues_service = __esm({
  "src/modules/issues/issues.service.ts"() {
    "use strict";
    init_db();
    init_error();
    createIssue = async (issueData, user) => {
      try {
        const { title, description, type } = issueData;
        const reporter_id = user?.id;
        console.log("Reporter ID:", reporter_id);
        if (!title) {
          throw new error_default(400, "Title is required");
        }
        if (title.length > 150) {
          throw new error_default(400, "Title should not exceed 150 characters");
        }
        if (!description) {
          throw new error_default(400, "Description is required");
        }
        if (description.length < 20) {
          throw new error_default(400, "Description should be at least 20 characters long");
        }
        if (!type) {
          throw new error_default(400, "Type is required");
        }
        if (type !== "bug" && type !== "feature_request") {
          throw new error_default(400, "Type should be either 'bug' or 'feature_request'");
        }
        if (!reporter_id) {
          throw new error_default(400, "only authenticated users can create issues");
        }
        const reporterCheck = await pool.query(`SELECT * FROM users WHERE id = $1`, [reporter_id]);
        if (!reporterCheck.rows[0]) {
          throw new Error("not a valid user");
        }
        const result = await pool.query(
          `INSERT INTO issues (title, description,type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *`,
          [title, description, type, reporter_id]
        );
        return result;
      } catch (error) {
        console.error("DB ERROR:", error.message);
        throw error;
      }
    };
    getAllIssues = async (req) => {
      const { sort, type, status } = req.query;
      let sql = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues`;
      const conditions = [];
      const values = [];
      if (type === "bug" || type === "feature_request") {
        conditions.push(`type = $${values.length + 1}`);
        values.push(type);
      }
      if (status === "open" || status === "in_progress" || status === "resolved") {
        conditions.push(`status = $${values.length + 1}`);
        values.push(status);
      }
      if (conditions.length) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      const sortOrder = sort === "oldest" ? "ASC" : "DESC";
      sql += ` ORDER BY created_at ${sortOrder}`;
      const issuesResult = await pool.query(sql, values);
      const issues = issuesResult.rows;
      const issuesWithReporter = [];
      for (const issue of issues) {
        const userRes = await pool.query(
          `SELECT id, name, role FROM users WHERE id = $1`,
          [issue.reporter_id]
        );
        issuesWithReporter.push({
          id: issue.id,
          title: issue.title,
          description: issue.description,
          type: issue.type,
          status: issue.status,
          reporter: userRes.rows[0],
          created_at: issue.created_at,
          updated_at: issue.updated_at
        });
      }
      return issuesWithReporter;
    };
    getIssueById = async (req) => {
      const { id } = req.params;
      const issueRes = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [id]
      );
      if (!issueRes.rows[0]) {
        throw new error_default(404, "Issue not found");
      }
      const userRes = await pool.query(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [issueRes.rows[0].reporter_id]
      );
      issueRes.rows[0].reporter = userRes.rows[0];
      return issueRes.rows[0];
    };
    updateIssue = async (req) => {
      try {
        const { id } = req.params;
        const { title, description, type, status } = req.body;
        const user = req.user;
        if (!user || !user.id) {
          throw new error_default(401, "Authentication required");
        }
        const findIssue = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
        if (findIssue.rows.length === 0) {
          throw new error_default(404, "Issue not found");
        }
        const issue = findIssue.rows[0];
        const isMaintainer = user.role === "maintainer";
        const isContributionOpen = user.role === "contributor" && issue.status === "open";
        if (!isMaintainer && !isContributionOpen) {
          throw new error_default(403, "You are not authorized to update this issue");
        }
        if (issue.reporter_id !== user.id && !isMaintainer) {
          throw new error_default(403, "You can only update issues you reported");
        }
        let updateSql = `UPDATE issues SET `;
        const updateValues = [];
        const values = [];
        if (title !== void 0) {
          updateValues.push(`title =$${values.length + 1}`);
          values.push(title);
        }
        if (description !== void 0) {
          updateValues.push(`description =$${values.length + 1}`);
          values.push(description);
        }
        if (type !== void 0) {
          if (type !== "bug" && type !== "feature_request") {
            throw new error_default(400, "Type should be either 'bug' or 'feature_request'");
          }
          updateValues.push(`type =$${values.length + 1}`);
          values.push(type);
        }
        if (status !== void 0 && isMaintainer) {
          if (!["open", "in_progress", "resolved"].includes(status)) {
            throw new error_default(400, "Status should be either 'open', 'in_progress' or 'resolved'");
          }
          updateValues.push(`status =$${values.length + 1}`);
          values.push(status);
        } else if (status !== void 0 && !isMaintainer) {
          throw new error_default(403, "Only maintainers can update the status");
        }
        if (updateValues.length === 0) {
          throw new error_default(400, "At least one field (title, description, type, status) must be provided for update");
        }
        updateValues.push(`updated_at = NOW()`);
        values.push(id);
        updateSql += updateValues.join(", ") + ` WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(updateSql, values);
        return result.rows[0];
      } catch (error) {
        console.error("Error during issue update:", error);
        throw error;
      }
    };
    deleteIssue = async (req) => {
      try {
        const { id } = req.params;
        const userRole = req.user?.role;
        if (userRole !== "maintainer") {
          throw new error_default(403, "Only maintainers can delete issues");
        }
        const deleteIssue3 = await pool.query(`DELETE FROM issues WHERE id = $1 RETURNING *`, [id]);
        if (deleteIssue3.rows.length === 0) {
          throw new error_default(404, "Issue not found");
        }
        return deleteIssue3.rows[0];
      } catch (error) {
        throw error;
      }
    };
    issueService = {
      createIssue,
      getAllIssues,
      getIssueById,
      deleteIssue,
      updateIssue
    };
  }
});

// src/modules/issues/issues.controller.ts
var createIssue2, getAllIssues2, getIssueById2, updateIssue2, deleteIssue2, issueController;
var init_issues_controller = __esm({
  "src/modules/issues/issues.controller.ts"() {
    "use strict";
    init_issues_service();
    createIssue2 = async (req, res) => {
      try {
        const result = await issueService.createIssue(
          req.body,
          req.user
        );
        res.status(201).json({ success: true, message: "Issue created successfully", issue: result.rows[0] });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    getAllIssues2 = async (req, res) => {
      try {
        const result = await issueService.getAllIssues(req);
        res.status(200).json({
          success: true,
          message: "Issues retrieved successfully",
          data: result
        });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    getIssueById2 = async (req, res) => {
      try {
        const result = await issueService.getIssueById(req);
        res.status(200).json({
          success: true,
          message: "Issue retrieved successfully",
          data: result
        });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    updateIssue2 = async (req, res) => {
      try {
        const result = await issueService.updateIssue(req);
        res.status(200).json({
          success: true,
          message: "Issue updated successfully",
          data: result
        });
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    deleteIssue2 = async (req, res) => {
      try {
        const result = await issueService.deleteIssue(req);
        if (result) {
          res.status(200).json({
            success: true,
            message: "Issue deleted successfully"
          });
        }
      } catch (error) {
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message
        });
      }
    };
    issueController = {
      createIssue: createIssue2,
      getAllIssues: getAllIssues2,
      getIssueById: getIssueById2,
      updateIssue: updateIssue2,
      deleteIssue: deleteIssue2
    };
  }
});

// src/modules/issues/issues.router.ts
import { Router as Router2 } from "express";
var router2, issueRouter;
var init_issues_router = __esm({
  "src/modules/issues/issues.router.ts"() {
    "use strict";
    init_issues_controller();
    init_auth();
    router2 = Router2();
    router2.post("/", auth_default(), issueController.createIssue);
    router2.get("/", issueController.getAllIssues);
    router2.get("/:id", issueController.getIssueById);
    router2.patch("/:id", auth_default(), issueController.updateIssue);
    router2.delete("/:id", auth_default(), issueController.deleteIssue);
    issueRouter = router2;
  }
});

// src/app.ts
import express from "express";
var app, app_default;
var init_app = __esm({
  "src/app.ts"() {
    "use strict";
    init_auth_route();
    init_issues_router();
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);
    app.use("/api/issues", issueRouter);
    app.get("/", (req, res) => {
      res.status(200).json({ message: "Hello assignment 2" });
    });
    app_default = app;
  }
});

// src/server.ts
var require_server = __commonJS({
  "src/server.ts"() {
    init_app();
    init_db();
    var main = () => {
      initDB();
      app_default.listen(5e3, () => {
        console.log("Server is running on port 5000");
      });
    };
    main();
  }
});
export default require_server();
//!  Genarate JWT token here and return it to the user
//# sourceMappingURL=server.mjs.map