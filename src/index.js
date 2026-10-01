import express from 'express';
import cors from 'cors';
import { PORT, CORS_WHITELIST } from '../config.service.js';
import { connectionDB } from './utils/database.js';
import invoicingRoutes from './routes/invoicingRoutes.js';
import { startPeriodicCleanup } from './services/tempPdf.service.js';
import './utils/events/email.event.js';

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

app.use((err, req, res, next) => {
    let status = typeof err.cause === 'number' ? err.cause : (err.status || 500);
    let message = err.message || 'Internal Server Error';

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Invalid Token';
    }

    res.status(status).json({
        message,
        ...(err.errors && { errors: err.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

const startServer = async () => {
    await connectionDB();

    // Start periodic background cleanup for temporary PDFs (every 5 mins, deletes > 30 mins)
    startPeriodicCleanup(5, 30);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();

export default app;

