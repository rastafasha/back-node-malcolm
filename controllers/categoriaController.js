const { response } = require('express');
const Categoria = require('../models/categoria');
const Blog = require('../models/blog');

const getCategorias = async(req, res) => {
    const categorias = await Categoria.find()

    res.json({
        ok: true,
        categorias
    });
};



const getCategoriasList = async(req, res) => {
    const categorias = await  Categoria.find()
    .sort({ createdAt: -1 });

    res.json({
        ok: true,
        categorias
    });
};

const getCategoria = async(req, res) => {

    const id = req.params.id;


    Categoria.findById(id, {})
        .exec((err, categoria) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar categoria',
                    errors: err
                });
            }
            if (!categoria) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El categoria con el id ' + id + 'no existe',
                    errors: { message: 'No existe un categoria con ese ID' }
                });

            }
            res.status(200).json({
                ok: true,
                categoria: categoria
            });
        });


    
};


const crearCategoria = async (req, res) => {

    const uid = req.uid;

    // Convertir el título en slug
    const name = req.body.name || '';
    const slug = name.toLowerCase()
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

    const categoria = new Categoria({
        usuario: uid,
        ...req.body,
        slug: slug,
    });

    try {

        const categoriaDB = await categoria.save();

        res.json({
            ok: true,
            categoria: categoriaDB
        });

    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el admin'
        });
    }
};

const actualizarCategoria = async (req, res) => {

    const id = req.params.id;
    const uid = req.uid;

    try {

        const categoria = await Categoria.findById(id);
        if (!categoria) {
            return res.status(500).json({
                ok: false,
                msg: 'categoria no encontrado por el id'
            });
        }

        const cambiosCategoria = {
            ...req.body,
            usuario: uid
        }

        // Si viene el título actualizado, actualizar el slug
        if (req.body.name) {
            const name = req.body.name;
            const slug = name.toLowerCase()
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
            cambiosCategoria.slug = slug;
        }


        const categoriaActualizado = await Categoria.findByIdAndUpdate(id, cambiosCategoria, { new: true });

        res.json({
            ok: true,
            categoriaActualizado
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            msg: 'Error hable con el admin'
        });
    }


};

const borrarCategoria = async(req, res) => {

    const id = req.params.id;

    try {

        const categoria = await Categoria.findById(id);
        if (!categoria) {
            return res.status(500).json({
                ok: false,
                msg: 'categoria no encontrado por el id'
            });
        }

        await Categoria.findByIdAndDelete(id);

        res.json({
            ok: true,
            msg: 'Categoria eliminado'
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error hable con el admin'
        });
    }
};



function find_by_name(req, res) {
    var name = req.params['name'];

    Categoria.findOne({ name: name })
        .exec((err, categoria_data) => {
            if (err) {
                res.status(500).send({ message: 'Ocurrió un error en el servidor.' });
            } else {
                if (categoria_data) {
                    res.status(200).send({ categoria: categoria_data });
                } else {
                    res.status(500).send({ message: 'No se encontró ningun dato en esta sección.' });
                }
            }
        });
}

function find_by_slug(req, res) {
    var slug = req.params['slug'];

    Categoria.findOne({ slug: slug })
        .exec((err, categoria_data) => {
            if (err) {
                res.status(500).send({ message: 'Ocurrió un error en el servidor.' });
            } else {
                if (categoria_data) {
                    res.status(200).send({ categoria: categoria_data });
                } else {
                    res.status(500).send({ message: 'No se encontró ningun dato en esta sección.' });
                }
            }
        });
}

const listarBlogPorCategoria = (req, res) => {
    var id = req.params['id'];
    Categoria.find({ blog: id }, (err, blog_data) => {
        if (!err) {
            if (blog_data) {
                res.status(200).send({ categoria: blog_data });
            } else {
                res.status(500).send({ error: err });
            }
        } else {
            res.status(500).send({ error: err });
        }
    });
}

const catactivos = async (req, res) => {
    try {
        // Buscamos las categorías con estatus 'PUBLISHED' usando promesas
        const portafolio_data = await Categoria.find({ status: 'PUBLISHED' });

        // Si la lista está vacía o no existe
        if (!portafolio_data || portafolio_data.length === 0) {
            return res.status(404).send({ message: 'No se encontró ningún dato en esta sección.' });
        }

        // Si contiene datos, respondemos con éxito
        return res.status(200).send({ categorias: portafolio_data });

    } catch (err) {
        // Captura cualquier error de la base de datos o del servidor
        return res.status(500).send({ message: 'Ocurrió un error en el servidor.', error: err.message });
    }
};


module.exports = {
    getCategorias,
    crearCategoria,
    actualizarCategoria,
    borrarCategoria,
    getCategoria,
    find_by_name,
    listarBlogPorCategoria,
    getCategoriasList,
    catactivos,
    find_by_slug
};