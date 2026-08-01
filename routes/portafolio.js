/* Ruta base: /api/portafolio */
const { Router } = require('express');
const router = Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

const {
    getPortafolios,
    getPortafolio,
    borrarPortafolio,
    crearPortafolio,
    actualizarPortafolio,
    listarPorCategoria,
    listarPorCategoriaId,
    migrarPortafolioBilingue
} = require('../controllers/portafolioController');

router.get('/', getPortafolios);
router.get('/migrar-portafolio-seguro', migrarPortafolioBilingue);
// SOLUCIÓN: Hacemos las URLs explícitas y diferentes
router.get('/category/name/:nombre', listarPorCategoria); // Nueva URL: /api/portafolio/category/name/DISEÑO
router.get('/category/:id', listarPorCategoriaId);    // Nueva URL: /api/portafolio/category/id/60d5ec...

router.post('/store', [
    check('title', 'el nombre es obligatorio').not().isEmpty(),
    validarCampos
], crearPortafolio);

router.put('/update/:id', [
    validarJWT,
    check('title', 'el nombre es obligatorio').not().isEmpty(),
    validarCampos
], actualizarPortafolio);

router.delete('/delete/:id', [validarJWT], borrarPortafolio);
router.get('/:id', getPortafolio);

module.exports = router;
