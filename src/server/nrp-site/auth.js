// auth.js

/**
 * Required External Modules
 */
const express = require("express");
const passport = require("passport");
const querystring = require("querystring");

const {
  buildAbsoluteUrl,
  getRequestHost,
  getRequestProtocol
} = require("./request-context");

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

      const safeParseUrl = (value) => {
        if (!value || typeof value !== "string") {
          return null;
        }

        try {
          return new URL(value);
        } catch (error) {
          return null;
        }
      };

      const ensureAbsoluteUrl = (rawValue) => {
        if (!rawValue || typeof rawValue !== "string") {
          return null;
        }

        const trimmed = rawValue.trim();
        if (!trimmed) {
          return null;
        }

        const direct = safeParseUrl(trimmed);
        if (direct) {
          return direct.toString();
        }

        const host = getRequestHost(req);
        if (!host) {
          return null;
        }

        const protocol = getRequestProtocol(req) || "http";

        try {
          const relativePath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
          return new URL(relativePath, `${protocol}://${host}`).toString();
        } catch (parseError) {
          return null;
        }
      };

      const fallbackReturnTo =
        ensureAbsoluteUrl(buildAbsoluteUrl(req, "/", applyBasePath)) ||
        ensureAbsoluteUrl(applyBasePath("/")) ||
        ensureAbsoluteUrl("/") ||
        "/";

      const fallbackUrl = safeParseUrl(fallbackReturnTo);

      const requestedReturnTo = (() => {
        if (!fallbackUrl) {
          return null;
        }

        const { returnTo } = req.query;
        if (!returnTo || typeof returnTo !== "string") {
          return null;
        }

        const trimmed = returnTo.trim();
        if (!trimmed) {
          return null;
        }

        const absoluteCandidate = ensureAbsoluteUrl(trimmed);
        if (!absoluteCandidate) {
          return null;
        }

        const candidateUrl = safeParseUrl(absoluteCandidate);
        if (!candidateUrl) {
          return null;
        }

        if (candidateUrl.origin !== fallbackUrl.origin) {
          return null;
        }

        return candidateUrl.toString();
      })() || fallbackReturnTo;

      const logoutURL = new URL(
        `https://${process.env.AUTH0_DOMAIN}/v2/logout`
      );

      const searchString = querystring.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        returnTo: requestedReturnTo
      });
      logoutURL.search = searchString;

      res.redirect(logoutURL);
    });
  });

  return router;
};

module.exports = createAuthRouter;
