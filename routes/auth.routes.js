const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')
const User = require('../models/User')
const router = Router()

router.post('/register', [
  check('email', 'Incorrect email').isEmail(),
  check('password', 'Min length is 6 symbols').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Incorrect credentials',
      })
    }

    const { email, password } = req.body

    const candidate = await User.findOne({ email })

    if (candidate) {
      return res.status(400).json({ message: 'User with this email is already exist' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = new User({ email, password: hashedPassword })

    await user.save()

    res.status(201).json({ message: 'User successfully created!' })

  } catch (e) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/login', [
  check('email', 'Incorrect email').normalizeEmail().isEmail(),
  check('password', 'Incorrect password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Incorrect credentials',
      })
    }

    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password)

    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Email or password not match' })
    }

    const token = jwt.sign(
      { userId: user.id },
      config.get('jwtSecret'),
      { expiresIn: '1h' },
    )

    res.json({
      token,
      userId: user.id,
    })

  } catch (e) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router
