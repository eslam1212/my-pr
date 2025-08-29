import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const APP_NAME = 'MyAccountingApp'; // Replace with your actual app name

export const twoFactorAuthUtils = {
  /**
   * Generates a new TOTP secret.
   * @returns {object} An object containing the ascii, hex, and base32 representations of the secret, and the otpauth_url.
   */
  generateSecret: (userEmail: string) => {
    const secret = speakeasy.generateSecret({
      length: 20, // Length of the secret
      name: `${APP_NAME} (${userEmail})`, // Displayed in authenticator app
      issuer: APP_NAME,
    });
    // The otpauth_url is what's encoded into the QR code
    return {
      ascii: secret.ascii,
      hex: secret.hex,
      base32: secret.base32, // This is typically what you store (encrypted)
      otpauth_url: secret.otpauth_url,
    };
  },

  /**
   * Generates a QR code data URL for the otpauth_url.
   * @param {string} otpauthUrl - The otpauth URL from generateSecret.
   * @returns {Promise<string>} A promise that resolves with the QR code data URL.
   */
  generateQRCodeDataURL: async (otpauthUrl: string): Promise<string> => {
    try {
      const dataUrl = await qrcode.toDataURL(otpauthUrl);
      return dataUrl;
    } catch (err) {
      console.error('Error generating QR code:', err);
      throw new Error('Could not generate QR code.');
    }
  },

  /**
   * Verifies a TOTP token against a stored secret.
   * @param {string} secret - The base32 encoded secret stored for the user.
   * @param {string} token - The token provided by the user.
   * @returns {boolean} True if the token is valid, false otherwise.
   */
  verifyToken: (secret: string, token: string): boolean => {
    if (!secret || !token) return false;
    return speakeasy.totp.verify({
      secret: secret, // The user's base32 secret
      encoding: 'base32',
      token: token,
      window: 1, // Allow for a 30-second window on either side
    });
  },

  /**
   * Generates a set of unique backup codes.
   * @param {number} count - The number of backup codes to generate.
   * @param {number} length - The length of each backup code.
   * @returns {string[]} An array of backup codes.
   */
  generateBackupCodes: (count = 10, length = 8): string[] => {
    const codes: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < length; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      // Add dashes for readability, e.g., XXXX-XXXX
      if (length === 8) {
         code = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
      }
      codes.push(code);
    }
    return codes;
  },

  /**
   * Verifies a backup code against a list of stored (hashed or encrypted) backup codes.
   * For this example, we'll assume codes are stored plain temporarily for simplicity,
   * but they should be hashed or encrypted and handled carefully.
   * @param {string} providedCode - The backup code provided by the user.
   * @param {string[]} storedCodes - The list of valid, unhashed backup codes for the user.
   * @returns {boolean} True if the code is valid and found in the stored codes.
   */
  verifyBackupCode: (providedCode: string, storedCodes: string[]): boolean => {
    if (!providedCode || !storedCodes || storedCodes.length === 0) {
      return false;
    }
    return storedCodes.includes(providedCode);
  },

  /**
   * Removes a used backup code from the list.
   * IMPORTANT: This function assumes `storedCodes` is mutable and directly modifies it.
   * In a real scenario, you would update the database to invalidate the code.
   * @param {string} usedCode - The backup code that was successfully used.
   * @param {string[]} storedCodes - The array of stored backup codes for the user.
   * @returns {string[]} The updated list of backup codes.
   */
  removeUsedBackupCode: (usedCode: string, storedCodes: string[]): string[] => {
    return storedCodes.filter(code => code !== usedCode);
  }
};

// Example usage (for testing purposes, not for production code here):
// (async () => {
//   const userEmailForOTP = "user@example.com";
//   const secretInfo = twoFactorAuthUtils.generateSecret(userEmailForOTP);
//   console.log('Secret Info:', secretInfo);

//   if (secretInfo.otpauth_url) {
//     const qrCodeData = await twoFactorAuthUtils.generateQRCodeDataURL(secretInfo.otpauth_url);
//     console.log('QR Code Data URL (sample):', qrCodeData.substring(0, 100) + '...'); // Log a snippet
//   }

//   // To verify, you'd need a token from an authenticator app synced with secretInfo.base32
//   // const isValid = twoFactorAuthUtils.verifyToken(secretInfo.base32, '123456'); // Replace '123456' with actual token
//   // console.log('Token valid:', isValid);

//   const backupCodes = twoFactorAuthUtils.generateBackupCodes();
//   console.log('Backup Codes:', backupCodes);
// })();
