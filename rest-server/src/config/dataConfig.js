
// get config from environment variables
const mysqlConfig = {
  user: process.env.OPENI_DB_USER,
  password: process.env.OPENI_DB_PWD,
  database: process.env.OPENI_DB_DATABASE,
  options: {
      host: process.env.OPENI_DB_HOST,
      port: process.env.OPENI_DB_PORT,
      dialet: "mysql",
  },
    adminName: process.env.DEFAULT_OPENI_ADMIN_USERNAME,
    adminPass: process.env.DEFAULT_OPENI_ADMIN_PASSWORD,
};

// module exports
module.exports = mysqlConfig;
