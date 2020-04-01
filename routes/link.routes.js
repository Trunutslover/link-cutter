const { Router } = require('express')
const shortid  = require('shortid')
const Link = require('../models/Link')
const authMiddleware = require('../middleware/auth.middleware')
const config = require('config')

const router = Router()

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const baseUrl = config.get('baseUrl')
    const { from } = req.body

    console.log(req.body)

    const code = shortid.generate()

    const existed = await Link.findOne({ from })

    if (existed) {
      return res.json({ link: existed })
    }

    const to = `${baseUrl}/t/${code}`

    const link = new Link({
      code,
      to,
      from,
      owner: req.user.userId,
    })

    await link.save()

    res.status(201).json({ link })

  } catch (e) {
    console.log(e)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.get('/', authMiddleware, async (req, res) => {
  try {
    const links = await Link.find({ owner: req.user.userId })
    res.json(links)
  } catch (e) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id)
    res.json(link)
  } catch (e) {
    res.status(500).json({ message: 'Internal server error' })
  }
})

module.exports = router
