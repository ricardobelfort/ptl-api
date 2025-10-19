import 'dotenv/config';
import { connectDB } from '@/config/db';
import mongoose from 'mongoose';

async function checkCollections() {
  await connectDB();
  
  console.log('🔍 Verificando collections no banco de dados...\n');
  
  // Listar todas as collections
  const db = mongoose.connection.db;
  if (!db) {
    console.log('❌ Erro: Conexão com o banco não estabelecida');
    process.exit(1);
  }
  
  const collections = await db.listCollections().toArray();
  
  console.log('📋 Collections encontradas:');
  collections.forEach((collection, index) => {
    console.log(`  ${index + 1}. ${collection.name}`);
  });
  
  // Verificar se nossa collection access_logs existe
  const hasAccessLogs = collections.some(col => col.name === 'access_logs');
  
  if (hasAccessLogs) {
    console.log('\n✅ Collection "access_logs" encontrada!');
    
    // Contar documentos na collection
    const count = await db.collection('access_logs').countDocuments();
    console.log(`📊 Total de documentos: ${count}`);
    
    if (count > 0) {
      // Mostrar alguns exemplos
      const samples = await db.collection('access_logs')
        .find({})
        .sort({ timestamp: -1 })
        .limit(3)
        .toArray();
      
      console.log('\n📄 Exemplos de documentos:');
      samples.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.method} ${doc.path} - ${doc.email} (${doc.statusCode})`);
      });
    }
  } else {
    console.log('\n❌ Collection "access_logs" não encontrada.');
    console.log('Execute npm run seed:access-logs para criar dados de exemplo.');
  }
  
  // Verificar outras collections relevantes
  const relevantCollections = ['usuarios', 'indicadores_mensais', 'access_logs'];
  console.log('\n🔍 Verificando collections do sistema:');
  
  for (const collectionName of relevantCollections) {
    const exists = collections.some(col => col.name === collectionName);
    if (exists) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`  ✅ ${collectionName}: ${count} documento(s)`);
    } else {
      console.log(`  ❌ ${collectionName}: não encontrada`);
    }
  }
  
  process.exit(0);
}

checkCollections().catch(console.error);