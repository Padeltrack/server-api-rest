import fs from 'fs';
import { parseSemanasField } from '../modules/video/video.helper';
import { ObjectId } from 'mongodb';
import { connectToMongo, disconnectFromMongo } from '../config/mongo.config';
import { VideoMongoModel } from '../modules/video/video.model';
import dotenv from 'dotenv';

const run = () => {
  dotenv.config();
  connectToMongo().then(async () => {
    const raw = fs.readFileSync('src/mocks/exercises_video_data.json', 'utf-8');
    const exercises = JSON.parse(raw);

    for (const doc of exercises) {
      delete doc.N;
      try {
        await VideoMongoModel.create({
          _id: new ObjectId().toHexString(),
          ...doc,
          semanas: parseSemanasField(doc?.semanas)
        });
      } catch (err) {
        console.error('Error inserting:', doc, err);
      }
    }

    console.log('Subida completada.');
    await disconnectFromMongo();
  });
};

run();
