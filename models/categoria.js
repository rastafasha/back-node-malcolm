var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CategoriaSchema = Schema({
    name: { type: String, required: true },
    status: { type: String, required: false, default: 'PENDING' },
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('categoria', CategoriaSchema);