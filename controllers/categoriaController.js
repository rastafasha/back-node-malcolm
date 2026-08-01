const { response } = require('express');
const Categoria = require('../models/categoria');
const Blog = require('../models/blog');
const { translate } = require('google-translate-api-x');
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

  // 1. Extraemos el nombre plano en español enviado por tu formulario
  const nameEs = req.body.name || '';

  // Generación correcta y segura del SLUG basada en el nombre en español
  const slug = nameEs
    .toLowerCase()
    .trim()
    .replace(/ñ/g, 'n')               // Reemplaza la eñe primero
    .normalize('NFD')                 // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')   // Elimina los símbolos de acentos sueltos
    .replace(/[\s]+/g, '-')           // Espacios a guiones
    .replace(/[^\w\-]+/g, '')         // Limpia caracteres especiales restantes
    .replace(/\-\-+/g, '-');          // Reduce guiones múltiples a uno solo

  try {
    // 🚀 TRADUCCIÓN AUTOMÁTICA: Traducimos el nombre de Español a Inglés
    const traducirName = await translate(nameEs, { from: 'es', to: 'en' });

    // 2. Crear la instancia adaptada al esquema bilingüe de MongoDB
    const categoria = new Categoria({
      ...req.body, // Trae el resto de campos si existen
      usuario: uid,
      slug: slug,
      
      // Convertimos el string plano en el sub-objeto { es, en }
      name: {
        es: nameEs,
        en: traducirName.text
      }
    });

    // 3. Guardar en la Base de Datos
    const categoriaDB = await categoria.save();
    
    res.json({ 
      ok: true, 
      categoria: categoriaDB 
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ 
      ok: false, 
      msg: 'Hable con el admin',
      error: error.message 
    });
  }
};


const actualizarCategoria = async (req, res) => {
  const id = req.params.id;
  const uid = req.uid;

  try {
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ // Cambiado a 404 de forma correcta
        ok: false, 
        msg: 'Categoría no encontrada por el id' 
      });
    }

    // Inicializamos los cambios básicos clonando el body de tu formulario plano
    const cambiosCategoria = { 
      ...req.body, 
      usuario: uid 
    };

    // 1. Si viene el nombre actualizado, actualizamos slug y traducimos
    if (req.body.name) {
      const nameEs = req.body.name;
      
      // Generación segura del SLUG
      const slug = nameEs
        .toLowerCase()
        .trim()
        .replace(/ñ/g, 'n')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s]+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

      cambiosCategoria.slug = slug;

      // 🚀 Traducimos automáticamente a inglés el nuevo nombre
      const traducirName = await translate(nameEs, { from: 'es', to: 'en' });

      // Convertimos la propiedad plana del body en el sub-objeto estructurado { es, en }
      cambiosCategoria.name = {
        es: nameEs,
        en: traducirName.text
      };
    }

    // 2. Ejecutar la actualización en MongoDB con validaciones activas
    const categoriaActualizado = await Categoria.findByIdAndUpdate(
      id, 
      cambiosCategoria, 
      { new: true, runValidators: true } // Agregado runValidators para blindar el modelo
    );

    res.json({ 
      ok: true, 
      categoriaActualizado 
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ 
      ok: false, 
      msg: 'Error hable con el admin',
      error: error.message
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