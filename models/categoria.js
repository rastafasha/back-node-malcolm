var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CategoriaSchema = Schema({
    name: {
        es: { type: String, required: [true, 'El título en español es obligatorio'] },
        en: { type: String, default: '' }
    },
    status: { type: String, required: false, default: 'PENDING' },
    slug: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('categoria', CategoriaSchema);