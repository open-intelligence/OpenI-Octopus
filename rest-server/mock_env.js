

/*** 
 * 本地测试用
*/
process.env.DEFAULT_OPENI_ADMIN_USERNAME = "admin";
process.env.DEFAULT_OPENI_ADMIN_PASSWORD = "KLtmMug9BDvvRjlg";

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "info";

process.env.SERVER_PORT = "9186";
process.env.JWT_SECRET = "Hello OPENI PCL!";
process.env.LOWDB_FILE = "rest-server/public_job.db.json";
process.env.NAT_FILE = "rest-server/natconfig.json";
process.env.USERDB_FILE = "rest-server/user_db.json";
process.env.JOB_LIMIT = "rest-server/joblimit.json";

process.env.ETCD_URI = "http://192.168.113.221:4001";
process.env.HDFS_URI = "hdfs://192.168.113.221:9000";
process.env.WEBHDFS_URI = "http://192.168.113.221:50070";
process.env.LAUNCHER_WEBSERVICE_URI = "http://192.168.113.221:9086";
process.env.YARN_URI = "http://192.168.113.221:8088";

process.env.VIRTUAL_DEBUG_CLUSTERS = ['default'];

process.env.CLUSTER_ID = "openi-pcl";

process.env.OPENI_DB_HOST="192.168.113.221",
process.env.OPENI_DB_PORT="3308",
process.env.OPENI_DB_USER="root",
process.env.OPENI_DB_PWD="root",
process.env.OPENI_DB_DATABASE="restserver",

require("./index");