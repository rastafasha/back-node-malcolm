/*
 Ruta: /api/categorias
 */

const { Router } = require('express');
const router = Router();
const {
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
} = require('../controllers/categoriaController');

const { validarJWT } = require('../middlewares/validar-jwt');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');

router.get('/', getCategorias);
router.get('/activos', catactivos);
router.get('/:id', getCategoria);
router.get('/category_by_nombre/:nombre', find_by_name);
router.get('/category_by_slug/:slug', find_by_slug);


router.post('/crear', [
    validarJWT,
    check('name', 'El nombre del categoria es necesario').not().isEmpty(),
    validarCampos
], crearCategoria);

router.put('/update/:id', [
    validarJWT,
    check('name', 'El nombre del categoria es necesario').not().isEmpty(),
    validarCampos
], actualizarCategoria);



router.delete('/:id', validarJWT, borrarCategoria);




module.exports = router;