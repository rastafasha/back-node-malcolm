const { response } = require('express');
const Portafolio = require('../models/portafolio');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');


const getPortafolios = async (req, res) => {

   try {
           const portafolios = await Portafolio.find()
               .sort({ createdAt: -1 })
               .populate('category')
           // .populate('ProjectType');
           //traemos las tareas en orden de ultima fecha
           portafolios.sort((a, b) => b.createdAt - a.createdAt);
   
   
           res.json({
               ok: true,
               portafolios
           });
       } catch (error) {
           return res.status(500).json({ message: 'Error al obtener proyectos' });
       }
};




const getPortafolio = async (req, res) => {

    const id = req.params.id;
    const uid = req.uid;

    Portafolio.findById(id)
        .populate('category')
        .exec((err, portafolio) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar portafolio',
                    errors: err
                });
            }
            if (!portafolio) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El portafolio con el id ' + id + 'no existe',
                    errors: { message: 'No existe un portafolio con ese ID' }
                });

            }
            res.status(200).json({
                ok: true,
                portafolio: portafolio
            });
        });
};


const crearPortafolio = async (req, res) => {

    const uid = req.uid;

    // Convertir el título en slug
    const title = req.body.title || '';
    const slug = title.toLowerCase()
        .trim()
        .replace(/[\s]+/g, '-') // reemplaza espacios por guiones
        .replace(/[^\w\-]+/g, '') // elimina caracteres no alfanuméricos excepto guiones
        .replace(/\-\-+/g, '-') // reemplaza guiones múltiples por uno solo
        // reemplaza acentos y caracteres especiales
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/ü/g, 'u');
    const introhome = req.body.description || '';
    //extraemos introhome desde description con un liminte de caracteres de 100
    const short_descripcion_limit = introhome.substring(0, 100);

    const portafolio = new Portafolio({
        usuario: uid,
        ...req.body,
        slug: slug,
        introhome: short_descripcion_limit
    });

    try {

        const portafolioDB = await portafolio.save();

        res.json({
            ok: true,
            portafolio: portafolioDB
        });

    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el admin'
        });
    }


};

const actualizarPortafolio = async (req, res) => {

    const id = req.params.id;
    const uid = req.uid;

    try {

        const portafolio = await Portafolio.findById(id);
        if (!portafolio) {
            return res.status(500).json({
                ok: false,
                msg: 'portafolio no encontrado por el id'
            });
        }

        const cambiosPortafolio = {
            ...req.body,
            usuario: uid
        }

        // Si viene el título actualizado, actualizar el slug
        if (req.body.title) {
            const title = req.body.title;
            const slug = title.toLowerCase()
                .trim()
                .replace(/[\s]+/g, '-') // reemplaza espacios por guiones
                .replace(/[^\w\-]+/g, '') // elimina caracteres no alfanuméricos excepto guiones
                .replace(/\-\-+/g, '-') // reemplaza guiones múltiples por uno solo
                // reemplaza acentos y caracteres especiales
                .replace(/á/g, 'a')
                .replace(/é/g, 'e')
                .replace(/í/g, 'i')
                .replace(/ó/g, 'o')
                .replace(/ú/g, 'u')
                .replace(/ñ/g, 'n')
                .replace(/ü/g, 'u');
            cambiosPortafolio.slug = slug;
        }

        if (req.body.introhome) {
            const introhome = req.body.introhome || '';
            const short_descripcion_limit = introhome.substring(0, 100);
            cambiosPortafolio.introhome = short_descripcion_limit;
        }

        const portafolioActualizado = await Portafolio.findByIdAndUpdate(id, cambiosPortafolio, { new: true });

        res.json({
            ok: true,
            portafolioActualizado
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            msg: 'Error hable con el admin'
        });
    }


};


const borrarPortafolio = async (req, res) => {

    const uid = req.params.id;

    try {

        const portafolioDB = await Portafolio.findById(uid);
        if (!portafolioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe el portafolio por ese id'
            });
        }

        await Portafolio.findByIdAndDelete(uid);

        res.json({
            ok: true,
            msg: 'Portafolio eliminado'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};

const listarPorCategoria = async (req, res) => {
    var name = req.params['nombre'];
    // 1. CAPTURAR EL NUEVO FILTRO DE ESTADO DESDE LA QUERY URL
    const estadoFilter = req.query.estado_seguimiento || null;

    try {
        // First, find the category by name
        const Categoria = require('../models/categoria');
        const categoria = await Categoria.findOne({ name: name });
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // 2. CONSTRUIR EL FILTRO DE BÚSQUEDA DINÁMICO
        let portafoliosFilter = { category: categoria._id };

        // Si el usuario envió un estado, lo agregamos al filtro de la consulta
        if (estadoFilter) {
            portafoliosFilter.estado_seguimiento = estadoFilter;
        }
        
        // Then, find portafolios using the category's ObjectId and the filters
        const portafolios = await Portafolio.find(portafoliosFilter)
            .populate('category');
        
        res.status(200).send({ portafolios: portafolios });
    } catch (err) {
        res.status(500).send({ error: err });
    }
}
const listarPorCategoriaId = async (req, res) => {
    var id = req.params['id'];
    // 1. CAPTURAR EL NUEVO FILTRO DE ESTADO DESDE LA QUERY URL
    const estadoFilter = req.query.estado_seguimiento || null;

    try {
        // First, find the category by name
        const Categoria = require('../models/categoria');
        const categoria = await Categoria.findOne({ id: id });
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // 2. CONSTRUIR EL FILTRO DE BÚSQUEDA DINÁMICO
        let portafoliosFilter = { category: categoria._id };

        // Si el usuario envió un estado, lo agregamos al filtro de la consulta
        if (estadoFilter) {
            portafoliosFilter.estado_seguimiento = estadoFilter;
        }
        
        // Then, find portafolios using the category's ObjectId and the filters
        const portafolios = await Portafolio.find(portafoliosFilter)
            .populate('category');
        
        res.status(200).send({ portafolios: portafolios });
    } catch (err) {
        res.status(500).send({ error: err });
    }
}


module.exports = {
    getPortafolios,
listarPorCategoria,
getPortafolio,
borrarPortafolio,
crearPortafolio,
actualizarPortafolio,
listarPorCategoriaId
};