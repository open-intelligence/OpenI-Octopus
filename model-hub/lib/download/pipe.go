package download

import (
	"io"
)


const BUF_SIZE int64 = 512

func Pipe(reader io.Reader,writer io.Writer,chunksize int64)(error) {

	var count int64 = 0

	var data_len int64

	var writeError error

	buf := make([]byte,BUF_SIZE,BUF_SIZE)

	var done bool = false

	for{
	 
		 
		n,err := reader.Read(buf)

		data_len = int64(n)
		
		if count + data_len >= chunksize{

			data_len = chunksize - count

			done = true
		}

		if err == nil {

			if data_len == BUF_SIZE{

				_,writeError = writer.Write(buf)

			}else if data_len >0 && data_len < BUF_SIZE{

				_,writeError = writer.Write(buf[0:data_len])

			}

			if nil != writeError{
				return writeError
			}

		}else{

			if "EOF" == err.Error(){//读到文件末尾了, read at the end of the file
				if n > 0 {
					_,writeError = writer.Write(buf[0:data_len])
				}
				break
			}else{
			    //非读到文件末尾的操作，则是异常 ,NOT EOF ERROR
				return err
			}
		}

		count = count + data_len

		if count == chunksize{
			done = true
		}

		if done == true{
			break;
		}

	}

	if nil != writeError{
		return writeError
	}

	return nil
}