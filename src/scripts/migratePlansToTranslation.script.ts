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
const oldPlanSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    description: String,
    price: Number,
    isCoach: Boolean,
    daysActive: Number,
    active: Boolean,
    benefits: [String],
  },
  {
    timestamps: true,
    collection: 'plans',
  },
);

const OldPlanModel = mongoose.model('OldPlan', oldPlanSchema);

// Esquema para el nuevo formato
const planTranslationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    benefits: { type: [String], required: true },
  },
  { _id: false },
);

const newPlanSchema = new mongoose.Schema(
  {
    _id: String,
    price: Number,
    isCoach: Boolean,
    daysActive: Number,
    active: Boolean,
    translate: {
      es: { type: planTranslationSchema, required: true },
      en: { type: planTranslationSchema, required: true },
      pt: { type: planTranslationSchema, required: true },
    },
  },
  {
    timestamps: true,
    collection: 'plans',
  },
);

const NewPlanModel = mongoose.model('NewPlan', newPlanSchema);

// Función para migrar un plan
const migratePlan = async (oldPlan: any) => {
  try {
    // Crear el objeto de traducción con los datos actuales (español)
    const translationData = {
      es: {
        name: oldPlan.name || '',
        description: oldPlan.description || '',
        benefits: oldPlan.benefits || [],
      },
      en: {
        name: '', // Vacío para inglés
        description: '',
        benefits: [],
      },
      pt: {
        name: '', // Vacío para portugués
        description: '',
        benefits: [],
      },
    };

    // Crear el nuevo documento
    const newPlan = new NewPlanModel({
      _id: oldPlan._id,
      price: oldPlan.price,
      isCoach: oldPlan.isCoach,
      daysActive: oldPlan.daysActive,
      active: oldPlan.active,
      translate: translationData,
      createdAt: oldPlan.createdAt,
      updatedAt: oldPlan.updatedAt,
    });

    return newPlan;
  } catch (error) {
    LoggerColor.error(`❌ Error migrating plan ${oldPlan._id}:`, error);
    throw error;
  }
};

// Función principal de migración
const migratePlans = async () => {
  try {
    LoggerColor.color('cyan').log('🚀 Starting plans migration to translation schema...');

    // Obtener todos los planes actuales
    const oldPlans = await OldPlanModel.find({});
    LoggerColor.color('yellow').log(`📊 Found ${oldPlans.length} plans to migrate`);

    if (oldPlans.length === 0) {
      LoggerColor.color('yellow').log('⚠️  No plans found to migrate');
      return;
    }

    // Crear backup de la colección actual
    LoggerColor.color('blue').log('💾 Creating backup...');
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    await db
      .collection('plans')
      .aggregate([{ $out: 'plans_backup_' + new Date().toISOString().replace(/[:.]/g, '-') }])
      .toArray();

    // Migrar cada plan
    const migratedPlans: any[] = [];
    for (const oldPlan of oldPlans) {
      LoggerColor.color('blue').log(`🔄 Migrating plan: ${oldPlan._id}`);
      const newPlan = await migratePlan(oldPlan);
      migratedPlans.push(newPlan);
    }

    // Eliminar la colección actual
    LoggerColor.color('yellow').log('🗑️  Dropping current plans collection...');
    await db.collection('plans').drop();

    // Insertar los planes migrados
    LoggerColor.color('blue').log('💾 Inserting migrated plans...');
    await NewPlanModel.insertMany(migratedPlans);

    LoggerColor.color('green').log(`✅ Successfully migrated ${migratedPlans.length} plans`);
    LoggerColor.color('green').log('✅ Migration completed successfully!');

    // Mostrar ejemplo de un plan migrado
    const examplePlan = await NewPlanModel.findOne({});
    if (examplePlan) {
      LoggerColor.color('cyan').log('📋 Example of migrated plan:');
      console.log(JSON.stringify(examplePlan.toObject(), null, 2));
    }
  } catch (error) {
    LoggerColor.error('❌ Migration failed:', error);
    throw error;
  }
};

// Función para verificar la migración
const verifyMigration = async () => {
  try {
    LoggerColor.color('cyan').log('🔍 Verifying migration...');

    const plans = await NewPlanModel.find({});
    LoggerColor.color('green').log(`✅ Found ${plans.length} plans in new schema`);

    // Verificar que todos los planes tienen la estructura correcta
    for (const plan of plans) {
      if (!plan.translate || !plan.translate.es || !plan.translate.en || !plan.translate.pt) {
        LoggerColor.error(`❌ Plan ${plan._id} has incorrect structure`);
        return false;
      }
    }

    LoggerColor.color('green').log('✅ All plans have correct translation structure');
    return true;
  } catch (error) {
    LoggerColor.error('❌ Verification failed:', error);
    return false;
  }
};

// Función para rollback (restaurar desde backup)
const rollbackMigration = async () => {
  try {
    LoggerColor.color('yellow').log('🔄 Rolling back migration...');

    // Buscar el backup más reciente
    const db = mongoose.connection?.db;
    if (!db) {
      LoggerColor.error('❌ Cannot access database connection for rollback');
      return;
    }
    const collections = await db.listCollections().toArray();
    const backupCollections = collections
      .filter(col => col.name.startsWith('plans_backup_'))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (backupCollections.length === 0) {
      LoggerColor.error('❌ No backup found for rollback');
      return;
    }

    const latestBackup = backupCollections[0].name;
    LoggerColor.color('blue').log(`📦 Restoring from backup: ${latestBackup}`);

    // Eliminar colección actual
    await db.collection('plans').drop();

    // Restaurar desde backup
    await db
      .collection(latestBackup)
      .aggregate([{ $out: 'plans' }])
      .toArray();

    LoggerColor.color('green').log('✅ Rollback completed successfully');
  } catch (error) {
    LoggerColor.error('❌ Rollback failed:', error);
  }
};

// Función principal
const main = async () => {
  try {
    await connectDB();

    const command = process.argv[2];

    switch (command) {
      case 'migrate':
        await migratePlans();
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
        LoggerColor.color('cyan').log('  npm run migrate:plans migrate    - Run migration');
        LoggerColor.color('cyan').log('  npm run migrate:plans verify    - Verify migration');
        LoggerColor.color('cyan').log('  npm run migrate:plans rollback  - Rollback migration');
        break;
    }
  } catch (error) {
    LoggerColor.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    LoggerColor.color('blue').log('👋 Disconnected from MongoDB');
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { migratePlans, verifyMigration, rollbackMigration };
