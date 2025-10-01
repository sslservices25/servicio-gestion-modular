import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Para GCM, el IV debe ser de 12 bytes
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Obtiene la clave de cifrado desde las variables de entorno
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  
  // Convertir la clave hexadecimal a Buffer
  return Buffer.from(key, 'hex');
}

/**
 * Cifra un texto plano usando AES-256-GCM
 * @param plaintext - Texto a cifrar
 * @returns Buffer con los datos cifrados (IV + salt + tag + ciphertext)
 */
export function encrypt(plaintext: string): Buffer {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    // Usar iv para el cifrado (aunque no se use directamente en createCipher)
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derivar clave usando PBKDF2 con el salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    
    const cipher = crypto.createCipher(ALGORITHM, derivedKey);
    cipher.setAAD(salt); // Usar salt como Additional Authenticated Data
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'binary');
    ciphertext += cipher.final('binary');
    
    const tag = cipher.getAuthTag();
    
    // Combinar IV + salt + tag + ciphertext en un solo Buffer
    const result = Buffer.concat([
      iv,
      salt,
      tag,
      Buffer.from(ciphertext, 'binary')
    ]);
    
    return result;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Descifra un Buffer cifrado usando AES-256-GCM
 * @param ciphertext - Buffer con los datos cifrados
 * @returns Texto descifrado
 */
export function decrypt(ciphertext: Buffer): string {
  try {
    if (ciphertext.length < IV_LENGTH + SALT_LENGTH + TAG_LENGTH) {
      throw new Error('Invalid ciphertext length');
    }
    
    const key = getEncryptionKey();
    
    // Extraer componentes del buffer
    const iv = ciphertext.subarray(0, IV_LENGTH);
    const salt = ciphertext.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
    const tag = ciphertext.subarray(IV_LENGTH + SALT_LENGTH, IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
    const encryptedData = ciphertext.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
    
    // Derivar la misma clave usando el salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipher(ALGORITHM, derivedKey);
    decipher.setAAD(salt); // Usar el mismo salt como AAD
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Función de utilidad para verificar que el cifrado funciona correctamente
 * @param testString - String de prueba
 * @returns true si el cifrado/descifrado funciona correctamente
 */
export function testEncryption(testString: string = 'test@email.com'): boolean {
  try {
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);
    return decrypted === testString;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}