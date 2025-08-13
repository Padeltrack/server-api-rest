import mongoose, { Schema, Document } from 'mongoose';

export interface VideoModel extends Document {
  readonly _id: string;
  nombre: string;
  idVideoVimeo: string;
  descripcion?: string;
  nivelFisico?: string;
  plan?: string[];
  semanas?: number[];
  objetivos?: string;
  momentoDeUso?: string;
  contraccion?: string;
  tipoEstimulo?: string;
  zonaCuerpo?: string;
  musculos?: string;
  sistemaControl?: string;
  series?: string;
  repeticiones?: string;
  areaContenido?: string;
  zonaPista?: string;
  tipoGolpe?: string;
  nivelJuego?: string;
  espacio?: string;
  material?: string;
  formato?: string;
  observacion?: string;
  recomendaciones?: string;
}

const VideoMongoSchema = new Schema<VideoModel>(
  {
    _id: { type: String, required: true },
    nombre: { type: String, required: true },
    idVideoVimeo: { type: String, required: true },
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

export const VideoMongoModel = mongoose.model<VideoModel>('Video', VideoMongoSchema);
