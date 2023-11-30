const {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyCode,
    login,
    getLoggedUser, 
    passwordRecovery,
    resetPassword,
} = require('../controllers/user.controllers');
const express = require('express');
const verifyJWT = require('../utils/verifyJWT');

const userRouter = express.Router();

userRouter.route('/')
    .get(verifyJWT, getAll)
    .post(create);


userRouter.route('/verify/:code')
    .get(verifyCode);

userRouter.route('/login')
    .post(login)

userRouter.route('/me')
    .get(verifyJWT, getLoggedUser);

userRouter.route('/:id')
    .get(verifyJWT, getOne)
    .delete(verifyJWT, remove)
    .put(verifyJWT, update);

userRouter.route('/password/recovery') // Crea codigo de recuperacion y envia correo con el userId
    .post(passwordRecovery)

userRouter.route('/password/reset') // resetea la contraseña con el valor que envie el usuario desde el front
    .post(resetPassword)


module.exports = userRouter;