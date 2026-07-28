/*
    Ruta: /api/portafolio
*/
const { Router } = require('express');
const router = Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const {
    getPortafolios,
getPortafolio,
borrarPortafolio,
crearPortafolio,
actualizarPortafolio,
listarPorCategoria
    
} = require('../controllers/portafolioController');
const {
    validarJWT
} = require('../middlewares/validar-jwt');

router.get('/', 
    // validarJWT, 
    getPortafolios);

  router.get('/category/:nombre',   listarPorCategoria);  

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

router.get('/:id', 
    // [validarJWT], 
    getPortafolio);




module.exports = router;

