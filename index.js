const express = require('express')

const app = express()

app.set('view engine', 'hbs')

// import uploadFile middleware
const upload = require('./middlewares/uploadFile')

app.use('/public', express.static(__dirname + '/public'))
app.use('/uploads', express.static(__dirname + '/uploads'))

app.use(express.urlencoded({ extended: false }))

// Import db connecction
const db = require('./connection/db')

// import bycript
const bycript = require('bcrypt')


// import express flsh
const flash = require('express-flash')
const session = require('express-session')
app.use(flash())

// setup middleware
app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
      secure: false,
      httpOnly: true
    },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: false,
    secret: "secretValue"

  })
)

const month = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'Desember'
]
// Create EndPoint
app.get('/', function (req, res) {
  res.render('index')
})

// fetching
app.get('/home', function (req, res) {

  let query = 'SELECT id, title, stardate, endstar, description, technologies,image FROM tb_project ORDER BY id DESC'
  db.connect(function (err, client, done) {
    if (err) throw err

    client.query(query, function (err, result) {
      done()

      if (err) throw err

      let data = result.rows

      data = data.map((blog) => {
        return {
          ...blog,
          post_age: getFullTime(blog.stardate),
          isLogin: req.session.isLogin

        }
      })
      res.render('index', {
        isLogin: req.session.isLogin,
        user: req.session.user,
        blogs: data
      })
    })
  })
})

// fetching
app.get('/detail-project/:id', function (req, res) {
  let { id } = req.params

  let query = `SELECT * FROM tb_project WHERE id = ${id}`

  db.connect((err, client, done) => {
    if (err) throw err

    client.query(query, (err, result) => {
      done()

      // result = result.rows[0]

      // res.render('detail-project', { blog: result })
      if (err) throw err
      let data = result.rows

      data = data.map((blog) => {
        return {
          ...blog,
          post_at: getFullTime(blog.stardate),
          post_age: getFullTime(blog.endstar),
          duration: durationTime(blog.stardate, blog.endstar)
        }
      })
      res.render('detail-project', {
        isLogin: req.session.isLogin,
        user: req.session.user,
        blogs: data
      })

    })
  })

})
app.get('/update-blog/:id', function (req, res) {
  let { id } = req.params

  let query = `SELECT * FROM tb_project WHERE id = ${id} `

  db.connect((err, client, done) => {
    if (err) throw err

    client.query(query, (err, result) => {
      done()
      if (err) throw err

      result = result.rows[0]

      res.render('update-blog', { blog: result })

    })
  })

})

app.post('/update-blog/:id', function (req, res) {
  let { id } = req.params
  let { title, description } = req.body

  let query = `UPDATE tb_project SET title = '${title}', description = '${description}' WHERE id = ${id}`

  db.connect((err, client, done) => {
    if (err) throw err

    client.query(query, (err, result) => {
      done()

      if (err) throw err

      res.redirect('/home')

    })
  })
})

app.get('/delete-card/:id', function (req, res) {
  let { id } = req.params

  let query = `DELETE FROM tb_project WHERE id = ${id}`

  db.connect((err, client, done) => {
    if (err) throw err

    client.query(query, (err, result) => {
      done()

      if (err) throw err

      res.redirect('/home')
    })
  })
})

app.get('/addmyProject', function (req, res) {
  if (!req.session.isLogin) {
    res.redirect('/home')
  }
  res.render('addmyProject')
})

app.post('/addmyProject', upload.single('image'), function (req, res) {

  let { title, stardate, endstar, description, skillCheck } = req.body

  let blog = {
    title,
    stardate,
    endstar,
    description,
    skillCheck,
    image: req.file.filename
  }
  db.connect((err, client, done) => {

    query = `INSERT INTO tb_project (title, stardate, endstar, description, technologies, image) VALUES ('${blog.title}', '${blog.stardate}', '${blog.endstar}', '${blog.description}', '{${blog.skillCheck}}', '${blog.image}')`

    if (err) throw err

    client.query(query, (err, result) => {
      done()
      if (err) throw err

      res.redirect('/home')

    })
  })

})
app.get('/register', function (req, res) {
  res.render('register')
})

app.post('/register', function (req, res) {

  let { name, email, password } = req.body

  let hashPassword = bycript.hashSync(password, 10)


  db.connect((err, client, done) => {
    if (err) throw err

    let query = `INSERT INTO tb_userproject(name, email, password) VALUES ('${name}', '${email}', '${hashPassword}')`

    client.query(query, (err, result) => {
      done()

      if (err) throw err

      req.flash('success', 'Registration Success')
      res.redirect('/login')

    })

  })
})

app.get('/login', function (req, res) {
  res.render('login')
})

app.post('/login', function (req, res) {
  let { email, password } = req.body

  db.connect((err, client, done) => {
    if (err) throw err

    let query = `SELECT * FROM tb_userproject WHERE email='${email}'`

    client.query(query, (err, result) => {
      if (err) throw err

      if (result.rowCount == 0) {
        req.flash('danger', 'Email dan password wrong!')
        return res.redirect('/login')
      }

      let isMatch = bycript.compareSync(password, result.rows[0].password)

      if (isMatch) {

        req.session.isLogin = true
        req.session.user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          name: result.rows[0].name
        }

        req.flash('success', 'Login Succes')
        res.redirect('/home')
      }
      else {
        req.flash('danger', 'Email dan password wrong!')
        res.redirect('/login')
      }

    })
  })

})

app.get('/logout', function (req, res) {
  req.session.destroy()

  res.redirect('/home')
})
app.get('/Contact', function (req, res) {
  res.render('contact')
})
app.post('/contact', function (req, res) {

  let { name, email, phone, opsi, komentar } = req.body

  let data = {
    name,
    email,
    phone,
    opsi,
    komentar
  }
  console.log(data)
})
const port = 5000
app.listen(port, function () {
  console.log(`server running on PORT ${port}`);
})

function durationTime(stardate, endstar) {
  // Convert Start - End Date to Days
  let newStartDate = new Date(stardate)
  let newEndDate = new Date(endstar)
  let duration = Math.abs(newStartDate - newEndDate)

  let day = Math.floor(duration / (1000 * 60 * 60 * 24))

  if (day < 30) {
    return day + ` days `
  } else {
    let diffMonths = Math.ceil(duration / (1000 * 60 * 60 * 24 * 30));
    if (diffMonths >= 1) {
      return diffMonths + ` month `
    }

  }
}

function getFullTime(time) {

  const date = time.getDate()
  const monthIndex = time.getMonth()
  const year = time.getFullYear()

  let hours = time.getHours()
  let minutes = time.getMinutes()

  if (hours < 10) {
    hours = `0${hours}`
  }

  if (minutes < 10) {
    minutes = `0${minutes}`
  }

  return `${date} ${month[monthIndex]} ${year}`
}

