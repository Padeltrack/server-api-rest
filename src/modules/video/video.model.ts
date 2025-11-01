import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoTranslation {
  nombre: string;
  descripcion: string;
  nivelFisico: string;
  objetivos: string;
  momentoDeUso: string;
  contraccion: string;
  tipoEstimulo: string;
  zonaCuerpo: string;
  musculos: string;
  sistemaControl: string;
  series: string;
  repeticiones: string;
  areaContenido: string;
  zonaPista: string;
  tipoGolpe: string;
  nivelJuego: string;
  espacio: string;
  material: string;
  formato: string;
  observacion: string;
  recomendaciones: string;
}

export interface VideoModel extends Document {
  readonly _id: string;
  idVideoVimeo: string;
  plan?: string[];
  semanas?: number[];
  translate: {
    es: IVideoTranslation;
    en: IVideoTranslation;
    pt: IVideoTranslation;
  };
}

const videoTranslationSchema = new Schema<IVideoTranslation>(
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

const VideoMongoSchema = new Schema<VideoModel>(
  {
    _id: { type: String, required: true },
    idVideoVimeo: { type: String, required: true },
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

export const VideoMongoModel = mongoose.model<VideoModel>('Video', VideoMongoSchema);
