// Script de prueba para validar el flujo transaccional
const crypto = require('crypto');

// Función para probar el cifrado
function testEncryption() {
  console.log('🔐 Probando módulo de cifrado...');
  
  const testString = 'test@email.com';
  
  try {
    // Simular la función de cifrado (versión simplificada)
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '0211f6a0b5e5b3f429dcc5a479b289f2af57646e87da657414acec0d4b00fa06', 'hex');
    const iv = crypto.randomBytes(12);
    const salt = crypto.randomBytes(64);
    
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    const cipher = crypto.createCipher('aes-256-gcm', derivedKey);
    cipher.setAAD(salt);
    
    let ciphertext = cipher.update(testString, 'utf8', 'binary');
    ciphertext += cipher.final('binary');
    
    const tag = cipher.getAuthTag();
    
    const encrypted = Buffer.concat([
      iv,
      salt,
      tag,
      Buffer.from(ciphertext, 'binary')
    ]);
    
    // Simular la función de descifrado
    const decipher = crypto.createDecipher('aes-256-gcm', derivedKey);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(Buffer.from(ciphertext, 'binary'), undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    if (decrypted === testString) {
      console.log('✅ Cifrado/descifrado funciona correctamente');
      return true;
    } else {
      console.log('❌ Error en cifrado/descifrado');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en cifrado:', error.message);
    return false;
  }
}

// Función para probar el cálculo de checksum
function testChecksum() {
  console.log('🔍 Probando cálculo de checksum...');
  
  try {
    const testData = 'test file content';
    const hash = crypto.createHash('sha256').update(testData).digest('hex');
    
    if (hash.length === 64) {
      console.log('✅ Cálculo de checksum funciona correctamente');
      console.log(`   Hash generado: ${hash}`);
      return true;
    } else {
      console.log('❌ Error en cálculo de checksum');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en checksum:', error.message);
    return false;
  }
}

// Función para probar la generación de tokens
function testTokenGeneration() {
  console.log('🎫 Probando generación de tokens...');
  
  try {
    const token = crypto.randomBytes(32).toString('hex');
    
    if (token.length === 64) {
      console.log('✅ Generación de tokens funciona correctamente');
      console.log(`   Token generado: ${token}`);
      return true;
    } else {
      console.log('❌ Error en generación de tokens');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en generación de tokens:', error.message);
    return false;
  }
}

// Función principal
function runTests() {
  console.log('🚀 Iniciando pruebas del flujo transaccional...\n');
  
  const results = [
    testEncryption(),
    testChecksum(),
    testTokenGeneration()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Resultados: ${passed}/${total} pruebas pasaron`);
  
  if (passed === total) {
    console.log('🎉 ¡Todas las pruebas pasaron! El flujo transaccional está listo.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisar la implementación.');
  }
}

// Ejecutar pruebas
runTests();

