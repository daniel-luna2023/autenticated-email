const catchError = require('../utils/catchError');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const EmailCode = require('../models/EmailCode');
const { use } = require('../routes');
const jwt = require('jsonwebtoken')


const getAll = catchError(async(req, res) => {
    const results = await User.findAll();
    return res.json(results);
});

const create = catchError(async(req, res) => {
  const {firstName, lastName, email, password, country, image, frontBaseUrl  } = req.body;
  const encriptedPassword = await bcrypt.hash(password, 10);
    const result = await User.create({
      firstName,
      lastName,
      email,
      country,
      image,
      password:encriptedPassword
    });

    const code = require('crypto').randomBytes(32).toString("hex")

    await EmailCode.create({
      code:code,
      userId:result.id
    })

  const link = `${frontBaseUrl}/auth/verify_email/${code}`;
   
  await sendEmail({
    to:`${email}`,
    subject:`hello ${firstName} ${lastName} this is email verificate for user app`,
    html:`
      <h1> hello ${firstName}</h1>
      <br>
      <a href="${link}">${link}</a>
    `
  })
    return res.status(201).json(result);
});


const passwordRecovery = catchError(async(req, res) => {
  const { email, frontBaseUrl } = req.body;

  const user = await User.findOne({ where: { email } })
  const code = require('crypto').randomBytes(32).toString("hex")

  await EmailCode.create({ code })

  const link = `${frontBaseUrl}/auth/reset_password/${code}?id=${user.id}`;
  await sendEmail({
    to:`${email}`,
    subject:`hello ${user.firstName} ${user.lastName} this is email to recover your password`,
    html:`
      <h1> hello ${user.firstName}</h1>
      <br>
      <a href="${link}">${link}</a>
    `
  })
  res.sendStatus(201);
});

const resetPassword = catchError(async (req, res) => {
  const { userId, password } = req.body
  const encriptedPassword = await bcrypt.hash(password, 10);
  let user = await User.findOne({ id: userId })
  user = {
    ...user,
    password: encriptedPassword
  }

  await User.update(user, { where: { id: userId } })

  res.sendStatus(201);
})


const getOne = catchError(async(req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if(!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async(req, res) => {
    const { id } = req.params;
    await User.destroy({ where: {id} });
    return res.sendStatus(204);
});

const update = catchError(async(req, res) => {
    const { id } = req.params;
    const {firstName, lastName, country, image } = req.params;
    const result = await User.update(
        {firstName, lastName, country, image},
        { where: {id}, returning: true }
    );
    if(result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});


// /user/verify/:code
const verifyCode = catchError(async(req, res) => {
  const { code } = req.params;
  const emailCode = await EmailCode.findOne({where: {code:code}})
  if(!emailCode) return res.status(401).json({message: "Code not found"})
  const user = await User.findByPk(emailCode.userId);
  user.isVerified = true;
  await user.save();
  await emailCode.destroy();
  return res.json(user);

})

const getLoggedUser = catchError(async(req, res) => {
  const user = req.user;
  return res.json(user);

})


const login = catchError(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  if (!user.isVerified) return res.status(401).json({ message: "user not verified" });
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: "invalid credentials" });


  const token = jwt.sign(
    { user },
    process.env.TOKEN_SECRET,
    { expiresIn: '1d' }

  );

  return res.json({ user, token });
});


module.exports = {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyCode,
    getLoggedUser,
    passwordRecovery,
    resetPassword,
    login
    
}
