// auth.js

/**
 * Required External Modules
 */
const express = require("express");
const router = express.Router();
const passport = require("passport");
const querystring = require("querystring");

require("dotenv").config();

const PUBLIC_URL = process.env.PUBLIC_URL && process.env.PUBLIC_URL.trim();

const forwardedValue = (value) => {
  if (!value) {
    return undefined;
  }
  return value.split(",")[0].trim();
};

const ensureLeadingSlash = (value) => {
  if (!value.startsWith("/")) {
    return `/${value}`;
  }
  return value;
};

const ensureTrailingSlash = (value) => {
  if (!value.endsWith("/")) {
    return `${value}/`;
  }
  return value;
};

const resolvePublicBaseUrl = (req) => {
  let base;

  if (PUBLIC_URL) {
    try {
      base = new URL(PUBLIC_URL);
    } catch (error) {
      console.warn("Invalid PUBLIC_URL provided; falling back to request data.");
    }
  }

  if (!base) {
    const host =
      forwardedValue(req.headers["x-forwarded-host"]) || req.get("host");
    const protocol =
      forwardedValue(req.headers["x-forwarded-proto"]) || req.protocol || "http";

    base = new URL(`${protocol}://${host || "localhost"}`);

    const prefix = forwardedValue(req.headers["x-forwarded-prefix"]);
    if (prefix) {
      base.pathname = ensureLeadingSlash(ensureTrailingSlash(prefix));
    }
  }

  base.pathname = ensureTrailingSlash(base.pathname);

  return base;
};

const buildPublicUrl = (req, pathname) => {
  const base = resolvePublicBaseUrl(req);
  if (typeof pathname === "string") {
    return new URL(pathname, base);
  }
  return new URL(base.toString());
};

/**
 * Routes Definitions
 */
router.get("/login", (req, res, next) => {
  if (typeof req.isAuthenticated === "function" && req.isAuthenticated()) {
    return res.redirect("/admin-panel");
  }

  if (req.session) {
    req.session.returnTo = "/admin-panel";
  }

  const authOptions = {
    scope: "openid email profile"
  };

  if (!process.env.AUTH0_CALLBACK_URL) {
    authOptions.callbackURL = buildPublicUrl(req, "callback").toString();
  }

  return passport.authenticate("auth0", authOptions)(req, res, next);
});

router.get("/callback", (req, res, next) => {
  passport.authenticate("auth0", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || "/admin-panel");
    });
  })(req, res, next);
});

router.get("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }

    const returnTo = buildPublicUrl(req).toString();

    const logoutURL = new URL(
      `https://${process.env.AUTH0_DOMAIN}/v2/logout`
    );

    const searchString = querystring.stringify({
      client_id: process.env.AUTH0_CLIENT_ID,
      returnTo: returnTo
    });
    logoutURL.search = searchString;

    res.redirect(logoutURL);
  });
});


/**
 * Module Exports
 */
module.exports = router;
