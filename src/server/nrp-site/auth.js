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

const safeParseUrl = (value) => {
  if (!value) {
    return null;
  }

  try {
    return value instanceof URL ? value : new URL(value);
  } catch (error) {
    return null;
  }
};

const coerceConfigUrl = (value, baseOrigin) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const direct = safeParseUrl(trimmed);
  if (direct) {
    return direct;
  }

  if (!baseOrigin) {
    return null;
  }

  try {
    const relativePath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return new URL(relativePath, baseOrigin);
  } catch (error) {
    return null;
  }
};

const resolveAbsoluteUrlFromRequest = (
  req,
  rawValue,
  { fallbackOrigin } = {}
) => {
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

  const origin = (() => {
    if (fallbackOrigin) {
      return fallbackOrigin;
    }

    const host = getRequestHost(req);
    if (!host) {
      return null;
    }

    const protocol = getRequestProtocol(req) || "http";
    return `${protocol}://${host}`;
  })();

  if (!origin) {
    return null;
  }

  try {
    const relativePath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return new URL(relativePath, origin).toString();
  } catch (error) {
    return null;
  }
};

const createAuthRouter = ({ applyBasePath = defaultApplyBasePath } = {}) => {
  const router = express.Router();

  const callbackUrl = safeParseUrl(process.env.AUTH0_CALLBACK_URL);
  const callbackOrigin = callbackUrl && callbackUrl.origin;
  const configuredLogoutUrl =
    coerceConfigUrl(process.env.AUTH0_LOGOUT_RETURN_TO, callbackOrigin) ||
    callbackUrl;

  const getRequestOriginUrl = (req) => {
    const absolute = buildAbsoluteUrl(req, "/", applyBasePath);
    const parsed = safeParseUrl(absolute);
    if (parsed) {
      return parsed;
    }

    const derived = resolveAbsoluteUrlFromRequest(req, applyBasePath("/"), {
      fallbackOrigin:
        (configuredLogoutUrl && configuredLogoutUrl.origin) || callbackOrigin
    });

    return safeParseUrl(derived);
  };

  const computeLogoutReturnTo = (req, rawReturnTo) => {
    const requestOriginUrl = getRequestOriginUrl(req);
    const fallbackUrl = configuredLogoutUrl || requestOriginUrl;
    const fallbackOrigin = fallbackUrl && fallbackUrl.origin;

    const allowedOrigins = new Set();
    if (configuredLogoutUrl) {
      allowedOrigins.add(configuredLogoutUrl.origin);
    }
    if (requestOriginUrl) {
      allowedOrigins.add(requestOriginUrl.origin);
    }

    const requestedUrl = (() => {
      if (!rawReturnTo || typeof rawReturnTo !== "string") {
        return null;
      }

      const absoluteCandidate = resolveAbsoluteUrlFromRequest(req, rawReturnTo, {
        fallbackOrigin
      });
      if (!absoluteCandidate) {
        return null;
      }

      const candidateUrl = safeParseUrl(absoluteCandidate);
      if (!candidateUrl) {
        return null;
      }

      if (allowedOrigins.size && !allowedOrigins.has(candidateUrl.origin)) {
        return null;
      }

      return candidateUrl;
    })();

    const resultUrl = requestedUrl || fallbackUrl;
    return resultUrl ? resultUrl.toString() : null;
  };

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
    const hasCode =
      req.query && typeof req.query.code === "string" && req.query.code.trim();
    const hasError =
      req.query && typeof req.query.error === "string" && req.query.error.trim();

    if (!hasCode && !hasError) {
      return res.redirect(applyBasePath("/login"));
    }

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

      const requestedReturnTo = computeLogoutReturnTo(req, req.query.returnTo);

      const logoutURL = new URL(
        `https://${process.env.AUTH0_DOMAIN}/v2/logout`
      );

      const params = {
        client_id: process.env.AUTH0_CLIENT_ID
      };

      if (requestedReturnTo) {
        params.returnTo = requestedReturnTo;
      }

      logoutURL.search = querystring.stringify(params);

      res.redirect(logoutURL.toString());
    });
  });

  const getLogoutReturnTo = (req) => computeLogoutReturnTo(req) || undefined;

  return { router, getLogoutReturnTo };
};

module.exports = createAuthRouter;
