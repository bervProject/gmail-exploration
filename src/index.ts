import app from './app';
import cron from 'node-cron';
import logger from './logger';

const defaultSchedule = process.env.CRON_TIME || '0 */3 * * *';

cron.schedule(defaultSchedule, () => {
    logger.info('Run spam cleaner!');
    app.start();
});

logger.info("Cron Scheduled");