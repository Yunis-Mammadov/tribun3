import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;

function scryptAsync(
  password: string,
  salt: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(
  password: string,
): Promise<string> {
  const salt = randomBytes(16).toString("hex");

  const derivedKey = await scryptAsync(password, salt);

  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !salt ||
    !hash
  ) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt);

  const storedKey = Buffer.from(hash, "hex");

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}