import crypto from "crypto";

export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const validateCSRFToken = (
  tokenFromRequest: string,
  tokenFromCookie: string
): boolean => {
  if (!tokenFromRequest || !tokenFromCookie) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(tokenFromRequest, "hex"),
    Buffer.from(tokenFromCookie, "hex")
  );
};
