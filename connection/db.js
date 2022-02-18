// import postgress pool
const { Pool } = require('pg')

// Setup connection pool

const dbPool = new Pool({
    database: 'personal-web-pagi',
    port: 5432,
    user: 'postgres',
    password: 'galung2897'

})

// export db pool to be used for query

module.exports = dbPool