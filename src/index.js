import express from 'express';
import cors from 'cors';
import { PORT, CORS_WHITELIST } from '../config.service.js';
import { connectionDB } from './utils/database.js';
import invoicingRoutes from './routes/invoicingRoutes.js';

const app = express();

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || CORS_WHITELIST.includes('*') || CORS_WHITELIST.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/invoicing', invoicingRoutes);

const startServer = async () => {
    await connectionDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();

export default app;
