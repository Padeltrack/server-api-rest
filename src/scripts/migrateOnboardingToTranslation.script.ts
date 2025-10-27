import mongoose from 'mongoose';
import LoggerColor from 'node-color-log';
import { configureEnvironment } from '../config/env.config';

configureEnvironment();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI as string;
    await mongoose.connect(mongoUri);
    LoggerColor.color('green').log('✅ Connected to MongoDB');
  } catch (error) {
    LoggerColor.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Esquema temporal para leer los datos actuales
const oldOnboardingSchema = new mongoose.Schema({
  _id: String,
  question: String,
  order: Number,
  options: [String],
}, { 
  timestamps: true,
  collection: 'onboarding_questions' 
});

const OldOnboardingModel = mongoose.model('OldOnboarding', oldOnboardingSchema);

// Esquema para el nuevo formato
const onboardingTranslationSchema = new mongoose.Schema({
  question: { type: String, required: false, default: null },
  options: { type: [String], required: false, default: null },
}, { _id: false });

const newOnboardingSchema = new mongoose.Schema({
  _id: String,
  order: Number,
  translate: {
    es: { type: onboardingTranslationSchema, required: true },
    en: { type: onboardingTranslationSchema, required: true },
    pt: { type: onboardingTranslationSchema, required: true },
  },
}, { 
  timestamps: true,
  collection: 'onboarding_questions' 
});

const NewOnboardingModel = mongoose.model('NewOnboarding', newOnboardingSchema);

// Función para migrar una pregunta de onboarding
const migrateOnboardingQuestion = async (oldQuestion: any) => {
  try {
    // Crear el objeto de traducción con los datos actuales (español)
    const translationData = {
      es: {
        question: oldQuestion.question || null,
        options: oldQuestion.options || null,
      },
      en: {
        question: null, // Vacío para inglés
        options: null,
      },
      pt: {
        question: null, // Vacío para portugués
        options: null,
      },
    };

    // Crear el nuevo documento
    const newQuestion = {
      _id: oldQuestion._id,
      order: oldQuestion.order,
      translate: translationData,
      createdAt: oldQuestion.createdAt,
      updatedAt: oldQuestion.updatedAt,
    };

    return newQuestion;
  } catch (error) {
    LoggerColor.error(`❌ Error migrating onboarding question ${oldQuestion._id}:`, error);
    throw error;
  }
};

// Función principal de migración
const migrateOnboarding = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    LoggerColor.color('cyan').log('🚀 Starting onboarding migration to translation schema...');

    // Obtener todas las preguntas actuales
    const oldQuestions = await OldOnboardingModel.find({});
    LoggerColor.color('yellow').log(`📊 Found ${oldQuestions.length} onboarding questions to migrate`);

    if (oldQuestions.length === 0) {
      LoggerColor.color('yellow').log('⚠️  No onboarding questions found to migrate');
      return;
    }

    // Crear backup de la colección actual
    LoggerColor.color('blue').log('💾 Creating backup...');
    await db.collection('onboarding_questions').aggregate([
      { $out: 'onboarding_questions_backup_' + new Date().toISOString().replace(/[:.]/g, '-') }
    ]).toArray();

    // Migrar cada pregunta
    const migratedQuestions: any[] = [];
    for (const oldQuestion of oldQuestions) {
      LoggerColor.color('blue').log(`🔄 Migrating question: ${oldQuestion._id}`);
      const newQuestion = await migrateOnboardingQuestion(oldQuestion);
      migratedQuestions.push(newQuestion);
    }

    // Eliminar la colección actual
    LoggerColor.color('yellow').log('🗑️  Dropping current onboarding_questions collection...');
    try {
      await db.collection('onboarding_questions').drop();
    } catch (error) {
      // La colección puede no existir, eso está bien
      LoggerColor.color('blue').log('ℹ️  Onboarding questions collection was already empty or non-existent');
    }

    // Insertar las preguntas migradas
    LoggerColor.color('blue').log('💾 Inserting migrated questions...');
    await NewOnboardingModel.insertMany(migratedQuestions);

    LoggerColor.color('green').log(`✅ Successfully migrated ${migratedQuestions.length} onboarding questions`);
    LoggerColor.color('green').log('✅ Onboarding migration completed successfully!');

    // Mostrar ejemplo de una pregunta migrada
    const exampleQuestion = await NewOnboardingModel.findOne({});
    if (exampleQuestion) {
      LoggerColor.color('cyan').log('📋 Example of migrated onboarding question:');
      console.log(JSON.stringify(exampleQuestion.toObject(), null, 2));
    }

  } catch (error) {
    LoggerColor.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    LoggerColor.color('blue').log('👋 Disconnected from MongoDB');
  }
};

// Función para verificar la migración
const verifyMigration = async () => {
  try {
    await connectDB();
    
    LoggerColor.color('cyan').log('🔍 Verifying onboarding migration...');
    
    const questions = await NewOnboardingModel.find({});
    LoggerColor.color('green').log(`✅ Found ${questions.length} questions in new schema`);
    
    // Verificar que todas las preguntas tienen la estructura correcta
    for (const question of questions) {
      if (!question.translate || !question.translate.es || !question.translate.en || !question.translate.pt) {
        LoggerColor.error(`❌ Question ${question._id} has incorrect structure`);
        return false;
      }
    }
    
    LoggerColor.color('green').log('✅ All onboarding questions have correct translation structure');
    return true;
  } catch (error) {
    LoggerColor.error('❌ Verification failed:', error);
    return false;
  } finally {
    await mongoose.disconnect();
    LoggerColor.color('blue').log('👋 Disconnected from MongoDB');
  }
};

// Función para rollback (restaurar desde backup)
const rollbackMigration = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    if (!db) {
      LoggerColor.error('❌ Cannot access database connection for rollback');
      return;
    }

    LoggerColor.color('yellow').log('🔄 Rolling back onboarding migration...');
    
    // Buscar el backup más reciente
    const collections = await db.listCollections().toArray();
    const backupCollections = collections
      .filter(col => col.name.startsWith('onboarding_questions_backup_'))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (backupCollections.length === 0) {
      LoggerColor.error('❌ No backup found for rollback');
      return;
    }
    
    const latestBackup = backupCollections[0].name;
    LoggerColor.color('blue').log(`📦 Restoring from backup: ${latestBackup}`);
    
    // Eliminar colección actual
    await db.collection('onboarding_questions').drop();
    
    // Restaurar desde backup
    await db.collection(latestBackup).aggregate([
      { $out: 'onboarding_questions' }
    ]).toArray();
    
    LoggerColor.color('green').log('✅ Onboarding rollback completed successfully');
  } catch (error) {
    LoggerColor.error('❌ Rollback failed:', error);
  } finally {
    await mongoose.disconnect();
    LoggerColor.color('blue').log('👋 Disconnected from MongoDB');
  }
};

// Función principal
const main = async () => {
  try {
    const command = process.argv[2];
    
    switch (command) {
      case 'migrate':
        await migrateOnboarding();
        await verifyMigration();
        break;
      case 'verify':
        await verifyMigration();
        break;
      case 'rollback':
        await rollbackMigration();
        break;
      default:
        LoggerColor.color('yellow').log('Usage:');
        LoggerColor.color('cyan').log('  npm run migrate:onboarding migrate    - Run migration');
        LoggerColor.color('cyan').log('  npm run migrate:onboarding verify    - Verify migration');
        LoggerColor.color('cyan').log('  npm run migrate:onboarding rollback  - Rollback migration');
        break;
    }
    
  } catch (error) {
    LoggerColor.error('❌ Script failed:', error);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { migrateOnboarding, verifyMigration, rollbackMigration };

