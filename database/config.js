const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const dbConnection = async () => {
    // Check if DB_MONGO is defined
    if (!process.env.DB_MONGO) {
        console.warn('ADVERTENCIA: DB_MONGO no está definida en las variables de entorno');
        return;
    }

    // For serverless environments, check if already connected
    if (mongoose.connection.readyState === 1) {
        console.log('DB ya conectada (cacheada)');
        return;
    }

    try {
        // Configure mongoose for serverless
        // mongoose.set('bufferCommands', false);
        // Removed bufferCommands: false to fix "Cannot call findOne() before initial connection is complete" error
        // This allows Mongoose to queue operations until connection is established
        
        await mongoose.connect(process.env.DB_MONGO, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 1,
        });
        
        console.log('✅ DB MongoDB Online');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('Error de conexión MongoDB:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB desconectado');
        });
        
    } catch (error) {
        console.error('❌ Error al conectar con MongoDB:', error.message);
        // Don't throw error in serverless to allow function to respond
        // throw new Error('Error al conectar con la base de datos');
    }
};

module.exports = {
    dbConnection
};

