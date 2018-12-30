package mysql_util



import (
	"time"
	"fmt"
	"os"
	"sync"
	"strings"
	"database/sql"
	_ "github.com/go-sql-driver/mysql"
	"ms_server/config"
	"github.com/json-iterator/go"
)

var db *sql.DB = nil

var mutex *sync.Mutex

func init(){
	mutex = new(sync.Mutex)
}

func initDB(){
	var err error
	db, err = sql.Open("mysql", config.Get(config.Mysql))
	if nil != err {
		fmt.Println("Can't  connect to mysql :"+config.Get(config.Mysql))
		fmt.Println(err)
		os.Exit(1)
	}

	db.SetConnMaxLifetime(10*time.Minute) // 最大存活时间10分钟
	db.SetMaxOpenConns(20)// 最大连接数 20
	db.SetMaxIdleConns(10)

	if err = db.Ping(); err != nil {
		fmt.Println("Open database fail")
		os.Exit(1)
	}

	fmt.Println("Connect mysql successfully")
}

 

//read only
func GetDB()(*sql.DB){
	 var _db  *sql.DB
	 mutex.Lock()
	 if nil == db{
		 initDB()
	 }
	 _db = db
	 mutex.Unlock()
	 return _db
}

func RowsToJsonArray(rows *sql.Rows)(string, error){
	columns, err := rows.Columns()
	
    if err != nil {
        return "",err
    }

	types,err:= rows.ColumnTypes()

	if err != nil {
        return "",err
	}
	
    values := make([]sql.RawBytes, len(columns))

    scanArgs := make([]interface{}, len(values))
    for i := range values {
        scanArgs[i] = &values[i]
    }

    list := "["

    for rows.Next() {
        err = rows.Scan(scanArgs...)
        if err != nil {
            return "",err
        }
        row := "{"
        var value string
        for i, col := range values {
            if col == nil {
                value = "NULL"
            } else {
                value = string(col)
            }

            columName := strings.ToLower(columns[i])
			var cell string

			type_name:=types[i].DatabaseTypeName()

			if "JSON" == type_name || "BOOL" == type_name || "INT" == type_name || "DECIMAL" == type_name{
				cell = fmt.Sprintf(`"%v":%v`, columName, value)
			}else{
				cell = fmt.Sprintf(`"%v":"%v"`, columName, value)
			}
           
            row = row + cell + ","
        }
        row = row[0 : len(row)-1]
        row += "}"
        list = list + row + ","

	}
	
	if len(list) > 1{
       list = list[0 : len(list)-1] +"]"
	}else{
	   list = list+"]"
	}
    
    return list,nil
}

func Query(sql string ,args ... interface{})error{
	db:= GetDB()
	rows,err:= db.Query(sql,args ...)

	if nil != err{
		return err
	}

	if nil != rows{
		rows.Close()
	}
	return nil
}

func QueryAsString(sql string ,args ... interface{})(string,error){
	db:= GetDB()

	rows,err:= db.Query(sql,args ...)

	if nil != err{
		return "",err
	}

	defer rows.Close()

	str,err:= RowsToJsonArray(rows)

	return str,err
}


func QueryAsJson(sql string, args ... interface{})(jsoniter.Any,error){
	db:= GetDB()

	rows,err:= db.Query(sql,args ...)

	if nil != err{
		return nil,err
	}

	defer rows.Close()

	str,err:= RowsToJsonArray(rows)

	if err != nil{
		return nil,err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	return json.Get([]byte(str)),nil
}