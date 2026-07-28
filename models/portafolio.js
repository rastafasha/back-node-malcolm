var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PortafolioSchema = Schema({
    title: { type: String, required: true },
    introhome: { type: String, required: true },
    description: { type: String, required: true },
    isFeatured: { type: String, required: true },
    youtubeurl: { type: String, required: false },
    popup: { type: String, required: false },
    url: { type: String, required: false },
    slug: { type: String, required: true, unique: false },
    img: { type: String },
    status: { type: String, required: false, default: 'PENDING' },
    category: { type: Schema.ObjectId, ref: 'categoria' },
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date }
});

module.exports = mongoose.model('portafolio', PortafolioSchema);