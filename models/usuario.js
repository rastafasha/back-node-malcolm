const { Schema, model } = require('mongoose');

const UsuarioSchema = Schema({
    first_name: { type: String, require: true },
    last_name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    pais: { type: String, require: false, ref: 'PAIS' },
    ciudad: { type: String, require: false },
    role: { type: String, require: true, default: 'USER' },
    driver: { type: Schema.ObjectId, require: false, ref: 'driver' },
    img: { type: String, },
    lang: { type: String, },
    telefono: { type: String, },
    numdoc: { type: String },
    google: { type: Boolean, default: false }
});

UsuarioSchema.method('toJSON', function() { // modificar el _id a uid, esconde el password
    const { __v, _id, password, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('user', UsuarioSchema);