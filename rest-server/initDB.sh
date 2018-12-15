mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p${MYSQL_PWD} -e "
create database if not exists restserver default character set utf8;
use restserver;
CREATE TABLE IF NOT EXISTS users (
  id int(11) NOT NULL AUTO_INCREMENT,
  username varchar(255) NOT NULL DEFAULT '',
  passwordKey varchar(255) NOT NULL DEFAULT '',
  admin BOOLEAN DEFAULT false,
  virtualCluster varchar(255) NOT NULL DEFAULT 'default',
  modifyTime datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY(username)
) AUTO_INCREMENT=1000 default character set utf8;
CREATE TABLE IF NOT EXISTS imageset (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL DEFAULT '',
  place varchar(255) NOT NULL DEFAULT '',
  description Text,
  provider varchar(255) NOT NULL DEFAULT '',
  createtime datetime NOT NULL,
  remark Text,
  PRIMARY KEY (id),
  UNIQUE KEY(name)
) AUTO_INCREMENT=1000 default character set utf8;"