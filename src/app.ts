import express from 'express'
import "express-async-errors"
import { initializeServices } from './config/dependencies';
const app = express()
initializeServices();
app.use(express.json());
export { app };