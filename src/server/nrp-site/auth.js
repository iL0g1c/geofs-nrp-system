// auth.js

/**
 * Required External Modules
 */
const express = require("express");
const passport = require("passport");
const querystring = require("querystring");

const { buildAbsoluteUrl } = require("./request-context");

require("dotenv").config();

const defaultApplyBasePath = (pathname = "/") =>
  pathname.startsWith("/") ? pathname : `/${pathname}`;

const createAuthRouter = ({ applyBasePath = defaultApplyBasePath } = {}) => {
  const router = express.Router();

  router.get(
    "/login",
    (req, res, next) => {
      if (typeof req.isAuthenticated === "function" && req.isAuthenticated()) {
        return res.redirect(applyBasePath("/admin-panel"));
      }

      if (req.session) {
        req.session.returnTo = applyBasePath("/admin-panel");
      }

      next();
    },
    passport.authenticate("auth0", {
      scope: "openid email profile"
    }),
    (req, res) => {
      res.redirect(applyBasePath("/admin-panel"));
    }
  );

  router.get("/callback", (req, res, next) => {
    passport.authenticate("auth0", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect(applyBasePath("/login"));
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        const returnTo = req.session.returnTo;
        delete req.session.returnTo;
        res.redirect(returnTo || applyBasePath("/admin-panel"));
      });
    })(req, res, next);
  });

  router.get("/logout", (req, res, next) => {
    req.logOut((err) => {
      if (err) {
        return next(err);
      }

      const returnTo =
        buildAbsoluteUrl(req, "/", applyBasePath) || applyBasePath("/") || "/";

      const logoutURL = new URL(
        `https://${process.env.AUTH0_DOMAIN}/v2/logout`
      );

      const searchString = querystring.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        returnTo
      });
      logoutURL.search = searchString;

      res.redirect(logoutURL);
    });
  });

  return router;
};

module.exports = createAuthRouter;
