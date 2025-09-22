// index.js

/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");

const expressSession = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

require("dotenv").config();

const createAuthRouter = require("./auth");
const {
  buildAbsoluteUrl,
  getRequestProtocol,
  getRequestHost
} = require("./request-context");

/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || "8000";
const host = process.env.HOST || "0.0.0.0";

const normalizeBasePath = (value) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading.slice(0, -1) : withLeading;
};

const basePath = normalizeBasePath(process.env.BASE_PATH);

const applyBasePath = (pathname = "/") => {
  const safePath = pathname && typeof pathname === "string" ? pathname : "/";
  const normalized = safePath.startsWith("/") ? safePath : `/${safePath}`;

  if (!basePath) {
    return normalized === "//" ? "/" : normalized;
  }

  if (normalized === "/") {
    return basePath;
  }

  return `${basePath}${normalized}`.replace(/\/{2,}/g, "/");
};

const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  const normalized = trustProxy.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") {
    app.set("trust proxy", 1);
  } else if (normalized === "false" || normalized === "0") {
    app.set("trust proxy", false);
  } else {
    app.set("trust proxy", trustProxy);
  }
} else if (app.get("env") === "production") {
  app.set("trust proxy", 1);
}

/**
 * Session Configuration
 */

const session = {
  secret: process.env.SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: false
};

if (app.get("env") === "production") {
  session.cookie.sameSite = "lax";

  if (app.get("trust proxy")) {
    // Let express-session detect HTTPS from the current request/proxy headers.
    session.cookie.secure = "auto";
  }
}

/**
 * Passport Configuration
 */
const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    /**
     * Access tokens are used to authorize users to an API
     * (resource server)
     * accessToken is the token to call the Auth0 API
     * or a secured third-party API
     * extraParams.id_token has the JSON Web Token
     * profile has all the information from the user
     */
    return done(null, profile);
  }
);

/**
 *  App Configuration
 */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.locals.basePath = basePath;
app.locals.applyBasePath = applyBasePath;

app.use((req, res, next) => {
  res.locals.basePath = basePath;
  res.locals.applyBasePath = applyBasePath;
  res.locals.requestProtocol = getRequestProtocol(req);
  res.locals.requestHost = getRequestHost(req);
  res.locals.absoluteUrl = (pathname = "/") =>
    buildAbsoluteUrl(req, pathname, applyBasePath);
  next();
});

if (basePath) {
  app.use(basePath, express.static(path.join(__dirname, "public")));
} else {
  app.use(express.static(path.join(__dirname, "public")));
}

app.use(expressSession(session));

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Creating custom middleware with Express
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

const authRouter = createAuthRouter({ applyBasePath });

app.use(basePath || "/", authRouter);

/**
 * Routes Definitions
 */
const secured = (req, res, next) => {
  if (req.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect(applyBasePath("/login"));
};

const router = express.Router();

router.get("/admin-panel", secured, (req, res, next) => {
  const { _raw, _json, ...userProfile } = req.user;
  res.render("admin-panel", {
    title: "Admin Panel",
    userProfile: userProfile
  });
});

const shipLocations = [
  {
    name: "USS Gerald R. Ford (CVN-78)",
    type: "Aircraft Carrier",
    status: "on-patrol",
    latitude: 36.97,
    longitude: -74.32,
    location: "Western Atlantic Ocean",
    speed: "24 kn",
    course: "075°",
    updated: "14:05 UTC"
  },
  {
    name: "USS Zumwalt (DDG-1000)",
    type: "Stealth Destroyer",
    status: "on-patrol",
    latitude: 33.42,
    longitude: 141.88,
    location: "Western Pacific Ocean",
    speed: "19 kn",
    course: "310°",
    updated: "13:20 UTC"
  },
  {
    name: "USS John P. Murtha (LPD-26)",
    type: "Amphibious Transport Dock",
    status: "in-port",
    latitude: 32.684,
    longitude: -117.173,
    location: "Naval Base San Diego",
    speed: "0 kn",
    course: "Docked",
    updated: "11:42 UTC"
  },
  {
    name: "USS Virginia (SSN-774)",
    type: "Fast Attack Submarine",
    status: "on-patrol",
    latitude: 64.82,
    longitude: 5.62,
    location: "Norwegian Sea",
    speed: "17 kn",
    course: "145°",
    updated: "15:31 UTC"
  },
  {
    name: "USS Freedom (LCS-1)",
    type: "Littoral Combat Ship",
    status: "maintenance",
    latitude: 27.951,
    longitude: -82.448,
    location: "Tampa Shipyard",
    speed: "0 kn",
    course: "In Drydock",
    updated: "09:18 UTC"
  },
  {
    name: "USNS Mercy (T-AH-19)",
    type: "Hospital Ship",
    status: "in-port",
    latitude: 33.741,
    longitude: -118.216,
    location: "Port of Los Angeles",
    speed: "0 kn",
    course: "Docked",
    updated: "10:56 UTC"
  }
];

router.get("/", (req, res) => {
  if (typeof req.isAuthenticated === "function" && req.isAuthenticated()) {
    return res.redirect(applyBasePath("/admin-panel"));
  }
  res.render("index", { title: "Home" });
});

router.get("/credits", (req, res) => {
  res.render("credits", { title: "Credits" });
});

router.get("/ship-tracker", secured, (req, res) => {
  res.render("ship-tracker", {
    title: "Fleet Operations Map",
    shipLocations
  });
});

app.use(basePath || "/", router);

/**
 * Server Activation
 */
app.listen(port, host, () => {
  console.log(`Listening to requests on ${host}:${port}`);
});
