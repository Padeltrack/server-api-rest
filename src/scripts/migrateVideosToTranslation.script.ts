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
const oldVideoSchema = new mongoose.Schema(
  {
    _id: String,
    nombre: String,
    idVideoVimeo: String,
    descripcion: String,
    nivelFisico: String,
    plan: [String],
    semanas: [Number],
    objetivos: String,
    momentoDeUso: String,
    contraccion: String,
    tipoEstimulo: String,
    zonaCuerpo: String,
    musculos: String,
    sistemaControl: String,
    series: String,
    repeticiones: String,
    areaContenido: String,
    zonaPista: String,
    tipoGolpe: String,
    nivelJuego: String,
    espacio: String,
    material: String,
    formato: String,
    observacion: String,
    recomendaciones: String,
  },
  {
    timestamps: true,
    collection: 'videos',
  },
);

const OldVideoModel = mongoose.model('OldVideo', oldVideoSchema);

// Esquema para el nuevo formato con translate
const videoTranslationSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: false, default: '' },
    descripcion: { type: String, required: false, default: '' },
    nivelFisico: { type: String, required: false, default: '' },
    objetivos: { type: String, required: false, default: '' },
    momentoDeUso: { type: String, required: false, default: '' },
    contraccion: { type: String, required: false, default: '' },
    tipoEstimulo: { type: String, required: false, default: '' },
    zonaCuerpo: { type: String, required: false, default: '' },
    musculos: { type: String, required: false, default: '' },
    sistemaControl: { type: String, required: false, default: '' },
    series: { type: String, required: false, default: '' },
    repeticiones: { type: String, required: false, default: '' },
    areaContenido: { type: String, required: false, default: '' },
    zonaPista: { type: String, required: false, default: '' },
    tipoGolpe: { type: String, required: false, default: '' },
    nivelJuego: { type: String, required: false, default: '' },
    espacio: { type: String, required: false, default: '' },
    material: { type: String, required: false, default: '' },
    formato: { type: String, required: false, default: '' },
    observacion: { type: String, required: false, default: '' },
    recomendaciones: { type: String, required: false, default: '' },
  },
  { _id: false },
);

const newVideoSchema = new mongoose.Schema(
  {
    _id: String,
    idVideoVimeo: { type: String, required: false, default: '' },
    plan: [String],
    semanas: [Number],
    translate: {
      es: { type: videoTranslationSchema, required: true },
      en: { type: videoTranslationSchema, required: true },
      pt: { type: videoTranslationSchema, required: true },
    },
  },
  {
    timestamps: true,
    collection: 'videos',
  },
);

const NewVideoModel = mongoose.model('NewVideo', newVideoSchema);

// Función para migrar un video
const migrateVideo = async (oldVideo: any) => {
  try {
    // Crear el objeto de traducción con los datos actuales (español)
    const translationData = {
      es: {
        nombre: oldVideo.nombre || '',
        descripcion: oldVideo.descripcion || '',
        nivelFisico: oldVideo.nivelFisico || '',
        objetivos: oldVideo.objetivos || '',
        momentoDeUso: oldVideo.momentoDeUso || '',
        contraccion: oldVideo.contraccion || '',
        tipoEstimulo: oldVideo.tipoEstimulo || '',
        zonaCuerpo: oldVideo.zonaCuerpo || '',
        musculos: oldVideo.musculos || '',
        sistemaControl: oldVideo.sistemaControl || '',
        series: oldVideo.series || '',
        repeticiones: oldVideo.repeticiones || '',
        areaContenido: oldVideo.areaContenido || '',
        zonaPista: oldVideo.zonaPista || '',
        tipoGolpe: oldVideo.tipoGolpe || '',
        nivelJuego: oldVideo.nivelJuego || '',
        espacio: oldVideo.espacio || '',
        material: oldVideo.material || '',
        formato: oldVideo.formato || '',
        observacion: oldVideo.observacion || '',
        recomendaciones: oldVideo.recomendaciones || '',
      },
      en: {
        nombre: '',
        descripcion: '',
        nivelFisico: '',
        objetivos: '',
        momentoDeUso: '',
        contraccion: '',
        tipoEstimulo: '',
        zonaCuerpo: '',
        musculos: '',
        sistemaControl: '',
        series: '',
        repeticiones: '',
        areaContenido: '',
        zonaPista: '',
        tipoGolpe: '',
        nivelJuego: '',
        espacio: '',
        material: '',
        formato: '',
        observacion: '',
        recomendaciones: '',
      },
      pt: {
        nombre: '',
        descripcion: '',
        nivelFisico: '',
        objetivos: '',
        momentoDeUso: '',
        contraccion: '',
        tipoEstimulo: '',
        zonaCuerpo: '',
        musculos: '',
        sistemaControl: '',
        series: '',
        repeticiones: '',
        areaContenido: '',
        zonaPista: '',
        tipoGolpe: '',
        nivelJuego: '',
        espacio: '',
        material: '',
        formato: '',
        observacion: '',
        recomendaciones: '',
      },
    };

    // Crear el nuevo documento
    const newVideo = {
      _id: oldVideo._id,
      idVideoVimeo: oldVideo.idVideoVimeo || '',
      plan: oldVideo.plan || [],
      semanas: oldVideo.semanas || [],
      translate: translationData,
      createdAt: oldVideo.createdAt,
      updatedAt: oldVideo.updatedAt,
    };

    return newVideo;
  } catch (error) {
    LoggerColor.error(`❌ Error migrating video ${oldVideo._id}:`, error);
    throw error;
  }
};

// Función principal de migración
const migrateVideos = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    LoggerColor.color('cyan').log('🚀 Starting videos migration to translation schema...');

    // Obtener todos los videos actuales
    const oldVideos = await OldVideoModel.find({});
    LoggerColor.color('yellow').log(`📊 Found ${oldVideos.length} videos to migrate`);

    if (oldVideos.length === 0) {
      LoggerColor.color('yellow').log('⚠️  No videos found to migrate');
      return;
    }

    // Crear backup de la colección actual
    LoggerColor.color('blue').log('💾 Creating backup...');
    await db
      .collection('videos')
      .aggregate([{ $out: 'videos_backup_' + new Date().toISOString().replace(/[:.]/g, '-') }])
      .toArray();

    // Migrar cada video
    const migratedVideos: any[] = [];
    for (const oldVideo of oldVideos) {
      LoggerColor.color('blue').log(`🔄 Migrating video: ${oldVideo._id}`);
      const newVideo = await migrateVideo(oldVideo);
      migratedVideos.push(newVideo);
    }

    // Eliminar la colección actual
    LoggerColor.color('yellow').log('🗑️  Dropping current videos collection...');
    try {
      await db.collection('videos').drop();
    } catch (error) {
      // La colección puede no existir, eso está bien
      LoggerColor.color('blue').log('ℹ️  Videos collection was already empty or non-existent');
    }

    // Insertar los videos migrados
    LoggerColor.color('blue').log('💾 Inserting migrated videos...');
    await NewVideoModel.insertMany(migratedVideos);

    LoggerColor.color('green').log(`✅ Successfully migrated ${migratedVideos.length} videos`);
    LoggerColor.color('green').log('✅ Videos migration completed successfully!');

    // Mostrar ejemplo de un video migrado
    const exampleVideo = await NewVideoModel.findOne({});
    if (exampleVideo) {
      LoggerColor.color('cyan').log('📋 Example of migrated video:');
      console.log(JSON.stringify(exampleVideo.toObject(), null, 2));
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

    LoggerColor.color('cyan').log('🔍 Verifying videos migration...');

    const videos = await NewVideoModel.find({});
    LoggerColor.color('green').log(`✅ Found ${videos.length} videos in new schema`);

    // Verificar que todos los videos tienen la estructura correcta
    for (const video of videos) {
      if (!video.translate || !video.translate.es || !video.translate.en || !video.translate.pt) {
        LoggerColor.error(`❌ Video ${video._id} has incorrect structure`);
        return false;
      }
    }

    LoggerColor.color('green').log('✅ All videos have correct translation structure');
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

    LoggerColor.color('yellow').log('🔄 Rolling back videos migration...');

    // Buscar el backup más reciente
    const collections = await db.listCollections().toArray();
    const backupCollections = collections
      .filter(col => col.name.startsWith('videos_backup_'))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (backupCollections.length === 0) {
      LoggerColor.error('❌ No backup found for rollback');
      return;
    }

    const latestBackup = backupCollections[0].name;
    LoggerColor.color('blue').log(`📦 Restoring from backup: ${latestBackup}`);

    // Eliminar colección actual
    await db.collection('videos').drop();

    // Restaurar desde backup
    await db
      .collection(latestBackup)
      .aggregate([{ $out: 'videos' }])
      .toArray();

    LoggerColor.color('green').log('✅ Videos rollback completed successfully');
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
        await migrateVideos();
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
        LoggerColor.color('cyan').log('  npm run migrate:schema:videos migrate    - Run migration');
        LoggerColor.color('cyan').log(
          '  npm run migrate:schema:videos verify    - Verify migration',
        );
        LoggerColor.color('cyan').log(
          '  npm run migrate:schema:videos rollback  - Rollback migration',
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

export { migrateVideos, verifyMigration, rollbackMigration };
