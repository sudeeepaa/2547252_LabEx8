const fs = require('fs').promises;
const path = require('path');

async function backupEvents() {
    try {
        const eventsFile = path.join(__dirname, 'data', 'events.json');
        const backupDir = path.join(__dirname, 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `events-backup-${timestamp}.json`);

        try {
            await fs.mkdir(backupDir, { recursive: true });
        } catch (error) {
        }

        const eventsData = await fs.readFile(eventsFile, 'utf8');
        const events = JSON.parse(eventsData);

        await fs.writeFile(backupFile, JSON.stringify(events, null, 2), 'utf8');

        console.log(`Backup created successfully!`);
        console.log(`Backup file: ${backupFile}`);
        console.log(`Events backed up: ${events.length}`);

        const backupFiles = await fs.readdir(backupDir);
        const eventBackups = backupFiles
            .filter(file => file.startsWith('events-backup-'))
            .sort()
            .reverse();

        if (eventBackups.length > 5) {
            const filesToDelete = eventBackups.slice(5);
            for (const file of filesToDelete) {
                await fs.unlink(path.join(backupDir, file));
                console.log(`Deleted old backup: ${file}`);
            }
        }

    } catch (error) {
        console.error('Backup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    backupEvents();
}

module.exports = { backupEvents };
