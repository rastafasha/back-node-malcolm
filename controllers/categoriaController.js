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

const crearCategoria = async(req, res) => {

    const uid = req.uid;
    const categoria = new Categoria({
        usuario: uid,
        ...req.body
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

const actualizarCategoria = async(req, res) => {

    const id = req.params.id;
    const uid = req.uid;

    try {

        const categoria = await Categoria.findById(id);
        if (!categoria) {
            return res.status(500).json({
                ok: false,
                msg: 'Categoria no encontrado por el id'
            });
        }

        const cambiosCategoria = {
            ...req.body,
            usuario: uid
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

module.exports = {
    getCategorias,
    crearCategoria,
    actualizarCategoria,
    borrarCategoria,
    getCategoria,
    find_by_name,
    listarBlogPorCategoria,
    getCategoriasList
};