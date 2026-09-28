import express from 'express';
import cors from 'cors';
import { PORT, CORS_WHITELIST } from '../config.service.js';
import { connectionDB } from './utils/database.js';
import invoicingRoutes from './routes/invoicingRoutes.js';
import authRoutes from './routes/auth.routes.js';


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

app.use('/api/auth', authRoutes);
app.use('/api/invoicing', invoicingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    const status = typeof err.cause === 'number' ? err.cause : 500;
    res.status(status).json({
        message: err.message || 'Internal Server Error',
        ...(err.errors && { errors: err.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

const startServer = async () => {
    await connectionDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();

export default app;

