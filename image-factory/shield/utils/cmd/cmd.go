package cmd

import (
	"os/exec"
	"bytes"
)


func  Run(command string,args []string) (bool,string) {

	cmd := exec.Command(command)

	for i:=0;i<len(args);i++{
		cmd.Args = append(cmd.Args,args[i])
	}

	var out_writer bytes.Buffer
	var err_writer bytes.Buffer
	 
	cmd.Stdout = &out_writer
	cmd.Stderr = &err_writer

	err:= cmd.Run()

	err_msg := err_writer.String()

	if err != nil  && "" == err_msg{
		err_msg = err.Error()
	} 

	if "" != err_msg{

		return false,err_msg
	}

	return true ,out_writer.String()
}