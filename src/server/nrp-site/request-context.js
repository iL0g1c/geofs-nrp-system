const normalizeHeaderValue = (value) => {
  if (!value) {
    return undefined;
  }

  const source = Array.isArray(value) ? value[0] : value;
  if (!source) {
    return undefined;
  }

  const [first] = String(source).split(",");
  const trimmed = first && first.trim();
  return trimmed || undefined;
};

const getRequestProtocol = (req) => {
  const forwarded = normalizeHeaderValue(req && req.headers && req.headers["x-forwarded-proto"]);
  if (forwarded) {
    return forwarded.toLowerCase();
  }

  if (req && typeof req.protocol === "string" && req.protocol) {
    return req.protocol.toLowerCase();
  }

  if (process.env.DEFAULT_REQUEST_PROTOCOL) {
    return process.env.DEFAULT_REQUEST_PROTOCOL.trim().toLowerCase();
  }

  return "http";
};

const getRequestHost = (req) => {
  const forwarded = normalizeHeaderValue(req && req.headers && req.headers["x-forwarded-host"]);
  if (forwarded) {
    return forwarded;
  }

  if (req && typeof req.get === "function") {
    const host = req.get("host");
    if (host) {
      return host;
    }
  }

  if (process.env.DEFAULT_REQUEST_HOST) {
    return process.env.DEFAULT_REQUEST_HOST.trim();
  }

  return undefined;
};

const buildAbsoluteUrl = (req, pathname = "/", applyBasePath = (value) => value) => {
  const safePath = typeof pathname === "string" && pathname ? pathname : "/";
  const relativePath = applyBasePath(safePath);

  const host = getRequestHost(req);
  if (!host) {
    return relativePath;
  }

  const protocol = getRequestProtocol(req) || "http";
  try {
    return new URL(relativePath, `${protocol}://${host}`).toString();
  } catch (err) {
    return relativePath;
  }
};

module.exports = {
  buildAbsoluteUrl,
  getRequestHost,
  getRequestProtocol
};
