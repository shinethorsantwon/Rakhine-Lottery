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
        console.log('🚀 Starting Deployment...');

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

        // 3. Upload Frontend (dist folder contents -> root/public)
        console.log('📤 Uploading Frontend...');
        const remotePublicDir = `${config.remoteRoot}/public`;
        await client.ensureDir(remotePublicDir);
        await client.uploadFromDir("dist", remotePublicDir);

        // 4. Upload Server (to root/public_html)
        console.log('📤 Uploading Backend...');

        // Upload individual server files to ROOT
        await client.uploadFrom("server/server.js", `${config.remoteRoot}/server.js`);
        await client.uploadFrom("package.json", `${config.remoteRoot}/package.json`);
        await client.uploadFrom(".env.production", `${config.remoteRoot}/.env`);

        // Ensure uploads directory exists
        await client.ensureDir(`${config.remoteRoot}/uploads`);
        await client.ensureDir(`${config.remoteRoot}/uploads/profiles`);
        await client.ensureDir(`${config.remoteRoot}/uploads/proofs`);

        console.log('🎉 Deployment Complete!');

    } catch (err) {
        console.error('❌ Deployment Failed:', err);
    } finally {
        client.close();
    }
};

deploy();
