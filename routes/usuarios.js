/*
    Ruta: /api/usuarios
*/
const { Router } = require('express');
const router = Router();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const {
    getUsuarios,
    crearUsuarios,
    actualizarUsuario,
    actualizarUAdmin,
    borrarUsuario,
    getUsuario,
    getAllUsers,
    set_token_recovery,
    verify_token_recovery,
    change_password,
    getTEmployees,
    getTDrivers,
    getTDriversLocal,
    getTClients,
    actualizarStatusUsuario,
    getUsuariobyCedula,
    crearCliente,
    
} = require('../controllers/usuarios');
const {
    validarJWT,
    validarAdminRole,
    validarAdminRoleOMismoUsuario,
    validarUserRole,
    validarUserRoleOMismoUsuario
} = require('../middlewares/validar-jwt');

router.get('/', 
    validarJWT, 
    getUsuarios);
router.get('/all/', 
    // validarJWT, 
    getAllUsers);
    
router.get('/employees/', validarJWT, getTEmployees);
router.get('/drivers/',
    //  validarJWT, 
     getTDrivers
    );
router.get('/drivers/local/:local',
    //  validarJWT, 
     getTDriversLocal
    );
router.get('/clients/', validarJWT, getTClients);

router.get('/user_token/set/:email', set_token_recovery);
router.get('/user_verify/token/:email/:codigo', verify_token_recovery);
router.put('/user_password/change/:email', change_password);

router.post('/registro', [
    check('first_name', 'el nombre es obligatorio').not().isEmpty(),
    check('password', 'el password es obligatorio').not().isEmpty(),
    check('email', 'el email es obligatorio').isEmail(),
    validarCampos
], crearUsuarios);

router.post('/registrocliente', [
    check('first_name', 'el nombre es obligatorio').not().isEmpty(),
    check('email', 'el email es obligatorio').isEmail(),
    validarCampos
], crearCliente);


router.put('/update/:id', [
    validarJWT,
    check('first_name', 'el nombre es obligatorio').not().isEmpty(),
    check('email', 'el email es obligatorio').isEmail(),
    validarCampos
], actualizarUsuario);

router.put('/admin_update/:id', [
    validarJWT,
    validarAdminRole,
    validarAdminRoleOMismoUsuario,
    check('first_name', 'el nombre es obligatorio').not().isEmpty(),
    check('email', 'el email es obligatorio').isEmail(),
    check('role', 'el role es obligatorio').not().isEmpty(),
    validarCampos
], actualizarUAdmin);

router.put('/update/statusrole/:id', [
    validarJWT,
    validarCampos
], actualizarStatusUsuario);

router.delete('/:id', [validarJWT, validarAdminRole], borrarUsuario);

router.get('/:id', 
    // [validarJWT], 
    getUsuario);
router.get('/numdoc/:numdoc', [validarJWT], getUsuariobyCedula);




module.exports = router;

