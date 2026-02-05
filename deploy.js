import ftp from 'basic-ftp';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const config = {
    host: "193.203.173.82",
    user: "u860480593.lottery.shinebuchay.com",
    password: "SBCltFTP2569",
    secure: false, // Explicitly set to false based on typical shared hosting FTP
    port: 21,
    remoteRoot: "/public_html"
};

const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${stderr}`);
                reject(error);
            } else {
                console.log(stdout);
                resolve();
            }
        });
    });
};

const deploy = async () => {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log('🚀 Starting Deployment (Frontend Only)...');

        // 1. Build Frontend
        console.log('📦 Building Frontend...');
        await runCommand('npm run build');

        // 2. Connect to FTP
        console.log('🔌 Connecting to FTP...');
        await client.access({
            host: config.host,
            user: config.user,
            password: config.password,
            secure: config.secure,
            port: config.port
        });

        console.log('✅ Connected!');

        // 3. Upload Frontend (dist folder contents -> root/public_html)
        console.log('📤 Uploading Frontend to public_html...');
        await client.uploadFromDir("dist", config.remoteRoot);

        console.log('🎉 Deployment Complete!');

    } catch (err) {
        console.error('❌ Deployment Failed:', err);
    } finally {
        client.close();
    }
};

deploy();
