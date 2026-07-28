const { response } = require('express');
const Blog = require('../models/blog');
const Categoria = require('../models/categoria');

const getBlogs = async (req, res) => {

    const blogs = await Blog.find({})
        .populate('usuario')
        .populate('pago')
        .populate('categoria');

    res.json({
        ok: true,
        blogs
    });
};

const getBlog = async (req, res) => {

    const id = req.params.id;
    const uid = req.uid;

    Blog.findById(id, {})
        .populate('usuario')
        .populate('pago')
        .populate('categoria')
        .exec((err, blog) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar blog',
                    errors: err
                });
            }
            if (!blog) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El blog con el id ' + id + 'no existe',
                    errors: { message: 'No existe un blog con ese ID' }
                });

            }
            res.status(200).json({
                ok: true,
                blog: blog
            });
        });

};

const crearBlog = async (req, res) => {

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
    const short_descripcion = req.body.introhome || '';
    //extraemos short_descripcion desde description con un liminte de caracteres de 100
    const short_descripcion_limit = short_descripcion.substring(0, 100);

    const blog = new Blog({
        usuario: uid,
        ...req.body,
        slug: slug,
        short_descripcion: short_descripcion_limit
    });

    try {

        const blogDB = await blog.save();

        res.json({
            ok: true,
            blog: blogDB
        });

    } catch (error) {
        // console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el admin'
        });
    }


};

const actualizarBlog = async (req, res) => {

    const id = req.params.id;
    const uid = req.uid;

    try {

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(500).json({
                ok: false,
                msg: 'blog no encontrado por el id'
            });
        }

        const cambiosBlog = {
            ...req.body,
            usuario: uid
        }

        // Si viene el título actualizado, actualizar el slug
        if (req.body.titulo) {
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
            cambiosBlog.slug = slug;
        }

        if (req.body.introhome) {
            const short_descripcion = req.body.introhome || '';
            const short_descripcion_limit = short_descripcion.substring(0, 100);
            cambiosBlog.short_descripcion = short_descripcion_limit;
        }

        const blogActualizado = await Blog.findByIdAndUpdate(id, cambiosBlog, { new: true });

        res.json({
            ok: true,
            blogActualizado
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            msg: 'Error hable con el admin'
        });
    }


};


const borrarBlog = async (req, res) => {

    const id = req.params.id;

    try {

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(500).json({
                ok: false,
                msg: 'blog no encontrado por el id'
            });
        }

        await Blog.findByIdAndDelete(id);

        res.json({
            ok: true,
            msg: 'blog eliminado'
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'Error hable con el admin'
        });
    }
};


function desactivar(req, res) {
    var id = req.params['id'];

    Blog.findByIdAndUpdate({ _id: id }, { status: 'Desactivado' }, (err, blog_data) => {
        if (err) {
            res.status(500).send({ message: err });
        } else {
            if (blog_data) {
                res.status(200).send({ blog: blog_data });
            } else {
                res.status(403).send({ message: 'No se actualizó el blog, vuelva a intentar nuevamente.' });
            }
        }
    })
}

function activar(req, res) {
    var id = req.params['id'];
    // console.log(id);
    Blog.findByIdAndUpdate({ _id: id }, { status: 'Activo' }, (err, blog_data) => {
        if (err) {
            res.status(500).send({ message: err });
        } else {
            if (blog_data) {
                res.status(200).send({ blog: blog_data });
            } else {
                res.status(403).send({ message: 'No se actualizó el blog, vuelva a intentar nuevamente.' });
            }
        }
    })
}

function destacados(req, res) {
 // 1. Obtenemos la página de la URL (ej: /recientes?page=2). 
    // Si no viene nada, por defecto es la 1.
    const page = parseInt(req.query.page) || 1;
    const limit = 4; // Tu límite actual
    const skip = (page - 1) * limit; // Cuántos posts saltar

    Blog.find({ isFeatured: ['true'] })
        .populate('usuario', 'email uid username')
        .populate('categoria', 'nombre _id')
        .skip(skip)   // <-- Nos saltamos los ya cargados
        .limit(limit) // <-- Traemos los siguientes 4
        .exec((err, data) => {
            if (err) {
                return res.status(500).send({ ok: false, message: 'Error en el servidor' });
            }
            
            if (data) {
                // Es buena práctica enviar 'ok: true' para que coincida con tu map del frontend
                res.status(200).send({ 
                    ok: true,
                    blogs: data 
                });
            } else {
                res.status(404).send({ ok: false, blogs: [] });
            }
        });
}

function activos(req, res) {

    Blog.find({ status: ['Activo'] }).populate('categoria').exec((err, blog_data) => {
        if (err) {
            res.status(500).send({ message: 'Ocurrió un error en el servidor.' });
        } else {
            if (blog_data) {
                res.status(200).send({ blogs: blog_data });
            } else {
                res.status(500).send({ message: 'No se encontró ningun dato en esta sección.' });
            }
        }
    });
}


function listar_newestPaginados(req, res) {
    // 1. Obtenemos la página de la URL (ej: /recientes?page=2). 
    // Si no viene nada, por defecto es la 1.
    const page = parseInt(req.query.page) || 1;
    const limit = 4; // Tu límite actual
    const skip = (page - 1) * limit; // Cuántos posts saltar
    
    Blog.find({ status: ['Activo'] })
        .populate('usuario', 'email uid username')
        .populate('categoria', 'nombre _id')
        .sort({ createdAt: -1 })
        .skip(skip)   // <-- Nos saltamos los ya cargados
        .limit(limit) // <-- Traemos los siguientes 4
        .exec((err, data) => {
            if (err) {
                return res.status(500).send({ ok: false, message: 'Error en el servidor' });
            }
            
            if (data) {
                // Es buena práctica enviar 'ok: true' para que coincida con tu map del frontend
                res.status(200).send({ 
                    ok: true,
                    blogs: data 
                });
            } else {
                res.status(404).send({ ok: false, blogs: [] });
            }
        });
}


async function find_by_slug(req, res) {
    const slug = req.params['slug'];
    const uid = req.uid;

    try {
        const blog_data = await Blog.findOne({ slug: slug })
            .populate('usuario', 'username img')
            .populate('categoria');

        if (!blog_data) return res.status(404).send({ message: 'No existe' });

        let fullContent = false;
        let esFavorito = false;
        let perfil = null; // <--- DEFINIR AQUÍ PARA EVITAR EL ERROR

        if (uid) {
            const existeFav = await Favorito.findOne({ usuario: uid, blog: blog_data._id });
            esFavorito = !!existeFav;

            perfil = await Profile.findOne({ usuario: uid }); // <--- ASIGNAR AQUÍ

            if (perfil) {
                const esPremium = perfil.plan !== 'free'; 
                const haComprado = perfil.pagos?.includes(blog_data._id); 
                const tieneCreditosGratis = perfil.articulosVistos < 3;

                if (esPremium || haComprado || tieneCreditosGratis) {
                    fullContent = true;
                }
            }
        }

        // Ahora 'perfil' sí existe aquí, aunque sea null
        return res.status(200).send({ 
            ok: true, 
            blog: blog_data, 
            fullContent: fullContent, 
            esFavorito: esFavorito,
            quedanGratis: perfil ? Math.max(0, 3 - (perfil.articulosVistos || 0)) : 0
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error en el servidor', error: err.message });
    }
}


const listarBlogPorUsuario = (req, res) => {
    var id = req.params['id'];
    Blog.find({ usuario: id }, (err, blog_data) => {
        if (!err) {
            if (blog_data) {
                res.status(200).send({ blogs: blog_data });
            } else {
                res.status(500).send({ error: err });
            }
        } else {
            res.status(500).send({ error: err });
        }
    }).populate('usuario');
}

async function listarBlogPorCategoria(req, res) {
    const nombre = req.params['nombre'];
    const uid = req.uid;
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    try {
        // 1. Buscamos los blogs
        const blogs = await Blog.find({ categoria: nombre })
            .populate('usuario', 'email uid username')
            .populate('categoria', 'nombre _id')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 2. Si el usuario está logueado, obtenemos sus favoritos
        let favoritosIds = [];
        if (uid) {
            const misFavoritos = await Favorito.find({ usuario: uid }, 'blog');
            favoritosIds = misFavoritos.map(fav => fav.blog.toString());
        }

        // 3. Mapeamos los blogs para añadirles la propiedad 'esFavorito' individualmente
        const dataConFavoritos = blogs.map(blog => {
            const blogObj = blog.toObject(); // Convertimos a objeto plano para poder añadirle campos
            blogObj.esFavorito = favoritosIds.includes(blog._id.toString());
            return blogObj;
        });

        res.status(200).send({
            ok: true,
            blogs: dataConFavoritos
        });

    } catch (err) {
        console.log(err);
        res.status(500).send({ ok: false, message: 'Error en el servidor' });
    }
}


const listar_best_sellers = (req, res) => {
    Blog.find().sort({ ventas: -1 }).limit(8).exec((err, blog) => {
        if (blog) {
            res.status(200).send({ blog: blog });
        }
    });
}

const cat_by_name = async (req, res) => {


    await Blog.find({}, 'categoria').filter('categoria', 'nombre').populate('name').exec((err, blog_data) => {
        if (err) {
            res.status(500).send({ message: 'Ocurrió un error en el servidor.' });
        } else {
            if (blog_data) {
                res.status(200).send({ blogs: blog_data });
            } else {
                res.status(500).send({ message: 'No se encontró ningun dato en esta sección.' });
            }
        }
    });
}

const aumentar_venta = (req, res) => {
    var id = req.params['id'];

    Blog.findById({ _id: id }, (err, blog) => {

        if (blog) {
            Blog.findByIdAndUpdate({ _id: id }, { ventas: parseInt(blog.ventas) + 1 }, (err, data) => {
                if (data) {
                    // console.log(data);
                    res.status(200).send({ data: data });
                } else {
                    // console.log(err);
                    res.status(500).send({ message: 'No se encontró ningun dato en esta sección.' });
                }
            })
        }
    })
}



module.exports = {
    getBlogs,
    crearBlog,
    getBlog,
    actualizarBlog,
    borrarBlog,
    desactivar,
    activar,
    destacados,
    find_by_slug,
    listar_newestPaginados,
    listarBlogPorUsuario,
    listarBlogPorCategoria,
    listar_best_sellers,
    cat_by_name,
    aumentar_venta,
    activos


};