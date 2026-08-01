var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PortafolioSchema = new Schema({
    title: {
        es: { type: String, required: [true, 'El título en español es obligatorio'] },
        en: { type: String, default: '' }
    },
    introhome: {
        es: { type: String, required: [true, 'La introducción en español es obligatoria'] },
        en: { type: String, default: '' }
    },
    description: {
        es: { type: String, required: [true, 'La descripción en español es obligatoria'] },
        en: { type: String, default: '' }
    },
    isFeatured: {
        type: Boolean, // Cambiado a Boolean si es un interruptor de "Destacado"
        default: false
    },
    youtubeurl: {
        type: String,
        required: false
    },
    popup: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: false
    },
    slug: {
        type: String,
        required: true,
        unique: false
    },
    img: {
        type: String
    },
    status: {
        type: String,
        required: false,
        default: 'PENDING',
        enum: ['PENDING', 'APPROVED', 'REJECTED'] // Validación opcional para controlar estados
    },
    category: {
        type: Schema.ObjectId,
        ref: 'categoria'
    },
    usuario: { // ⚠️ ¡IMPORTANTE! Faltaba esta referencia en tu esquema original
        type: Schema.ObjectId,
        ref: 'Usuario',
        required: true
    }
}, {
    timestamps: true // Esto genera automáticamente 'createdAt' y 'updatedAt' sin declararlos manualmente
});

module.exports = mongoose.model('portafolio', PortafolioSchema);