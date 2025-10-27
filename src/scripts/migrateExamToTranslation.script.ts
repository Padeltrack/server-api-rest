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
const oldExamSchema = new mongoose.Schema(
  {
    _id: String,
    title: String,
    description: String,
    idVideoVimeo: String,
    order: Number,
  },
  {
    timestamps: true,
    collection: 'examquestions',
  },
);

const OldExamModel = mongoose.model('OldExam', oldExamSchema);

// Esquema para el nuevo formato
const examTranslationSchema = new mongoose.Schema(
  {
    title: { type: String, required: false, default: '' },
    description: { type: String, required: false, default: '' },
  },
  { _id: false },
);

const newExamSchema = new mongoose.Schema(
  {
    _id: String,
    idVideoVimeo: String,
    order: Number,
    translate: {
      es: { type: examTranslationSchema, required: true },
      en: { type: examTranslationSchema, required: true },
      pt: { type: examTranslationSchema, required: true },
    },
  },
  {
    timestamps: true,
    collection: 'examquestions',
  },
);

const NewExamModel = mongoose.model('NewExam', newExamSchema);

// Función para migrar un examen
const migrateExam = async (oldExam: any) => {
  try {
    // Crear el objeto de traducción con los datos actuales (español)
    const translationData = {
      es: {
        title: oldExam.title || '',
        description: oldExam.description || '',
      },
      en: {
        title: '', // Vacío para inglés
        description: '',
      },
      pt: {
        title: '', // Vacío para portugués
        description: '',
      },
    };

    // Crear el nuevo documento
    const newExam = {
      _id: oldExam._id,
      idVideoVimeo: oldExam.idVideoVimeo,
      order: oldExam.order,
      translate: translationData,
      createdAt: oldExam.createdAt,
      updatedAt: oldExam.updatedAt,
    };

    return newExam;
  } catch (error) {
    LoggerColor.error(`❌ Error migrating exam ${oldExam._id}:`, error);
    throw error;
  }
};

// Función principal de migración
const migrateExams = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    LoggerColor.color('cyan').log('🚀 Starting exam migration to translation schema...');

    // Obtener todos los exámenes actuales
    const oldExams = await OldExamModel.find({});
    LoggerColor.color('yellow').log(`📊 Found ${oldExams.length} exams to migrate`);

    if (oldExams.length === 0) {
      LoggerColor.color('yellow').log('⚠️  No exams found to migrate');
      return;
    }

    // Crear backup de la colección actual
    LoggerColor.color('blue').log('💾 Creating backup...');
    await db
      .collection('examquestions')
      .aggregate([
        { $out: 'examquestions_backup_' + new Date().toISOString().replace(/[:.]/g, '-') },
      ])
      .toArray();

    // Migrar cada examen
    const migratedExams: any[] = [];
    for (const oldExam of oldExams) {
      LoggerColor.color('blue').log(`🔄 Migrating exam: ${oldExam._id}`);
      const newExam = await migrateExam(oldExam);
      migratedExams.push(newExam);
    }

    // Eliminar la colección actual
    LoggerColor.color('yellow').log('🗑️  Dropping current examquestions collection...');
    try {
      await db.collection('examquestions').drop();
    } catch (error) {
      // La colección puede no existir, eso está bien
      LoggerColor.color('blue').log(
        'ℹ️  Exam questions collection was already empty or non-existent',
      );
    }

    // Insertar los exámenes migrados
    LoggerColor.color('blue').log('💾 Inserting migrated exams...');
    await NewExamModel.insertMany(migratedExams);

    LoggerColor.color('green').log(`✅ Successfully migrated ${migratedExams.length} exams`);
    LoggerColor.color('green').log('✅ Exam migration completed successfully!');

    // Mostrar ejemplo de un examen migrado
    const exampleExam = await NewExamModel.findOne({});
    if (exampleExam) {
      LoggerColor.color('cyan').log('📋 Example of migrated exam:');
      console.log(JSON.stringify(exampleExam.toObject(), null, 2));
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

    LoggerColor.color('cyan').log('🔍 Verifying exam migration...');

    const exams = await NewExamModel.find({});
    LoggerColor.color('green').log(`✅ Found ${exams.length} exams in new schema`);

    // Verificar que todos los exámenes tienen la estructura correcta
    for (const exam of exams) {
      if (!exam.translate || !exam.translate.es || !exam.translate.en || !exam.translate.pt) {
        LoggerColor.error(`❌ Exam ${exam._id} has incorrect structure`);
        return false;
      }
    }

    LoggerColor.color('green').log('✅ All exams have correct translation structure');
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

    LoggerColor.color('yellow').log('🔄 Rolling back exam migration...');

    // Buscar el backup más reciente
    const collections = await db.listCollections().toArray();
    const backupCollections = collections
      .filter(col => col.name.startsWith('examquestions_backup_'))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (backupCollections.length === 0) {
      LoggerColor.error('❌ No backup found for rollback');
      return;
    }

    const latestBackup = backupCollections[0].name;
    LoggerColor.color('blue').log(`📦 Restoring from backup: ${latestBackup}`);

    // Eliminar colección actual
    await db.collection('examquestions').drop();

    // Restaurar desde backup
    await db
      .collection(latestBackup)
      .aggregate([{ $out: 'examquestions' }])
      .toArray();

    LoggerColor.color('green').log('✅ Exam rollback completed successfully');
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
        await migrateExams();
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
        LoggerColor.color('cyan').log('  npm run migrate:schema:exam migrate    - Run migration');
        LoggerColor.color('cyan').log('  npm run migrate:schema:exam verify    - Verify migration');
        LoggerColor.color('cyan').log(
          '  npm run migrate:schema:exam rollback  - Rollback migration',
        );
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

export { migrateExams, verifyMigration, rollbackMigration };
