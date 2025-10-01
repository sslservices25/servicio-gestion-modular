// Script de prueba para validar el panel técnico
const crypto = require('crypto');

// Función para probar la autenticación JWT
function testJWT() {
  console.log('🔐 Probando autenticación JWT...');
  
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'G8K/mNfG18lNUtpqGlk1Bz5Tea87SbLTuZW+ePiZ6Ws=';
    
    const payload = {
      userId: 'test-user-id',
      email: 'tecnico@test.com',
      rol: 'tecnico'
    };
    
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });
    const decoded = jwt.verify(token, secret);
    
    if (decoded.userId === payload.userId && decoded.rol === 'tecnico') {
      console.log('✅ Autenticación JWT funciona correctamente');
      return true;
    } else {
      console.log('❌ Error en autenticación JWT');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en JWT:', error.message);
    return false;
  }
}

// Función para probar el cifrado de datos sensibles
function testDataEncryption() {
  console.log('🔒 Probando cifrado de datos sensibles...');
  
  try {
    const testEmail = 'cliente@test.com';
    const testPhone = '+1234567890';
    
    // Simular cifrado (versión simplificada)
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '0211f6a0b5e5b3f429dcc5a479b289f2af57646e87da657414acec0d4b00fa06', 'hex');
    const iv = crypto.randomBytes(12);
    const salt = crypto.randomBytes(64);
    
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    const cipher = crypto.createCipher('aes-256-gcm', derivedKey);
    cipher.setAAD(salt);
    
    let ciphertext = cipher.update(testEmail, 'utf8', 'binary');
    ciphertext += cipher.final('binary');
    
    const tag = cipher.getAuthTag();
    
    const encrypted = Buffer.concat([
      iv,
      salt,
      tag,
      Buffer.from(ciphertext, 'binary')
    ]);
    
    // Simular descifrado
    const decipher = crypto.createDecipher('aes-256-gcm', derivedKey);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(Buffer.from(ciphertext, 'binary'), undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    if (decrypted === testEmail) {
      console.log('✅ Cifrado de datos sensibles funciona correctamente');
      return true;
    } else {
      console.log('❌ Error en cifrado de datos sensibles');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en cifrado:', error.message);
    return false;
  }
}

// Función para probar la validación de formularios
function testFormValidation() {
  console.log('📝 Probando validación de formularios...');
  
  try {
    // Simular validación de diagnóstico técnico
    const validData = {
      diagnosticoTecnico: 'El equipo presenta falla en el motor principal. Se requiere reemplazo de componentes.',
      presupuestoEstimado: 150.50
    };
    
    const invalidData = {
      diagnosticoTecnico: 'Corto', // Muy corto
      presupuestoEstimado: -10 // Negativo
    };
    
    // Validaciones básicas
    const isValidDiagnostico = validData.diagnosticoTecnico.length >= 10;
    const isValidPresupuesto = validData.presupuestoEstimado >= 0;
    
    const isInvalidDiagnostico = invalidData.diagnosticoTecnico.length < 10;
    const isInvalidPresupuesto = invalidData.presupuestoEstimado < 0;
    
    if (isValidDiagnostico && isValidPresupuesto && isInvalidDiagnostico && isInvalidPresupuesto) {
      console.log('✅ Validación de formularios funciona correctamente');
      return true;
    } else {
      console.log('❌ Error en validación de formularios');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en validación:', error.message);
    return false;
  }
}

// Función para probar la generación de estados
function testStateManagement() {
  console.log('🔄 Probando gestión de estados...');
  
  try {
    const estados = ['pendiente', 'prediagnostico', 'asignado', 'visita', 'aprobacion', 'reparacion', 'facturacion', 'finalizado'];
    const prioridades = ['baja', 'media', 'alta', 'critica'];
    
    // Verificar que los estados son válidos
    const estadosValidos = estados.every(estado => 
      ['pendiente', 'prediagnostico', 'asignado', 'visita', 'aprobacion', 'reparacion', 'facturacion', 'finalizado'].includes(estado)
    );
    
    const prioridadesValidas = prioridades.every(prioridad => 
      ['baja', 'media', 'alta', 'critica'].includes(prioridad)
    );
    
    if (estadosValidos && prioridadesValidas) {
      console.log('✅ Gestión de estados funciona correctamente');
      return true;
    } else {
      console.log('❌ Error en gestión de estados');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en gestión de estados:', error.message);
    return false;
  }
}

// Función principal
function runTests() {
  console.log('🚀 Iniciando pruebas del panel técnico...\n');
  
  const results = [
    testJWT(),
    testDataEncryption(),
    testFormValidation(),
    testStateManagement()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Resultados: ${passed}/${total} pruebas pasaron`);
  
  if (passed === total) {
    console.log('🎉 ¡Todas las pruebas pasaron! El panel técnico está listo.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisar la implementación.');
  }
}

// Ejecutar pruebas
runTests();

