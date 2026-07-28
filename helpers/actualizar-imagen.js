const fs = require('fs');
const Portafolio = require('../models/portafolio');

const borrarImagen = (path) => {

    if (fs.existsSync(path)) {
        // Verificar que sea un archivo y no un directorio
        const stats = fs.lstatSync(path);
        if (stats.isFile()) {
            //borrar la imagen anterior
            fs.unlinkSync(path);
        }
    }
}

const actualizarImagen = async (tipo, id, nombreArchivo, campoDestino = null) => {

    let pathViejo = '';

    switch (tipo) {

        case 'portafolios':
            const portafolio = await Portafolio.findById(id);
            if (!portafolio) {
                console.log('No es un portafolios por id');
                return false;
            }
            pathViejo = `./uploads/portafolios/${portafolio.img}`;
            borrarImagen(pathViejo);
            portafolio.img = nombreArchivo;
            await portafolio.save();
            return true;
            break;

            
    }
};

module.exports = {
    actualizarImagen,
    borrarImagen
};