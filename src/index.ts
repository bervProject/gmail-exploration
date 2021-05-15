import app from './app';
import cron from 'node-cron';
import logger from './logger';

cron.schedule('0 */3 * * *', () => {
    logger.info('Run spam cleaner!');
    app.start();
});

